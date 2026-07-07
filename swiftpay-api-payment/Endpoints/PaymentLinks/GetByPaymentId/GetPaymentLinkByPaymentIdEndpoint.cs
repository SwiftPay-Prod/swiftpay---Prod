using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Utils;
using swiftpay_api_payment.Endpoints.PaymentLinks.Get;
using swiftpay_api_payment.Endpoints.Transactions.Create;
using swiftpay_api_payment.EndpointsGroups;

namespace swiftpay_api_payment.Endpoints.PaymentLinks.GetByPaymentId;

public sealed class GetPaymentLinkByPaymentIdEndpoint(
    PrimaryDbContext dbContext
) : EndpointWithoutRequest<GetPaymentLinkByPaymentIdResponse>
{
    public override void Configure()
    {
        Get("payments/{paymentId:guid}");
        Group<PaymentLinksGroup>();
        AllowAnonymous();
        Description(d => d
            .Produces<GetPaymentLinkByPaymentIdResponse>(200, "application/json")
            .Produces<GetPaymentLinkByPaymentIdResponse>(404, "application/json")
            .Produces<GetPaymentLinkByPaymentIdResponse>(410, "application/json")
            .WithSummary("Obter pagamento por paymentId")
            .WithDescription("Retorna os dados públicos de pagamento via paymentId para páginas de cobrança por domínio."));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var paymentId = Route<Guid>("paymentId");

        var payment = await dbContext.Payments
            .IgnoreQueryFilters()
            .Include(p => p.PaymentPix)
            .Include(p => p.PaymentBoleto)
            .Include(p => p.Customer)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == paymentId
                && !p.SuppressMerchantVisibility, ct);

        if (payment == null)
        {
            await Send.ResponseAsync(new GetPaymentLinkByPaymentIdResponse
            {
                Error = new("Pagamento não encontrado.")
            }, 404, ct);
            return;
        }

        var platformDbSettings = await dbContext.PlatformSettings
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(ct) ?? new PlatformSettings();

        var merchantSettings = await dbContext.MerchantSettings
            .AsNoTracking()
            .Where(ms => ms.MerchantId == payment.MerchantId)
            .OrderBy(ms => ms.Id)
            .FirstOrDefaultAsync(ct);

        var resolvedBranding = PlatformLinkResolver.ResolvePaymentLinkBranding(
            platformDbSettings,
            merchantSettings,
            payment.Method);

        var expiresAt = payment.ExpiresAt;

        if (expiresAt.HasValue && expiresAt.Value < DateTime.UtcNow
            && payment.Status == PaymentStatus.Pending)
        {
            await Send.ResponseAsync(new GetPaymentLinkByPaymentIdResponse
            {
                Error = new("Este pagamento expirou.")
            }, 410, ct);
            return;
        }

        await Send.OkAsync(new GetPaymentLinkByPaymentIdResponse
        {
            Data = ToPaymentLinkData(payment, resolvedBranding)
        }, ct);
    }

    private static PaymentLinkData ToPaymentLinkData(Payment payment, PaymentLinkDomainOption? branding)
    {
        var data = new PaymentLinkData
        {
            Id = payment.Id,
            PaymentLinkId = payment.Id,
            PaymentId = payment.Id,
            EnabledMethods = [payment.Method],
            Method = payment.Method,
            Amount = payment.Amount,
            Currency = payment.Currency.ToString(),
            Status = payment.Status,
            Description = payment.Description,
            Environment = payment.Environment,
            ExpiresAt = payment.ExpiresAt,
            CreatedAt = payment.CreatedAt,
            CompletedAt = payment.CompletedAt,
            IsPaymentStarted = true,
            IsUnlimitedLink = false,
            RedirectUrl = null,
            RequiredBuyerFields = [],
            ShowFees = false,
            FeeAmounts = [],
            PassFeeToCustomer = false,
            ShowSwiftPayBranding = branding?.ShowSwiftPayBranding ?? true,
            ThemeMode = null,
            LogoUrl = null,
            ProductName = null,
            ProductImageUrl = null
        };

        if (payment.PaymentPix != null)
        {
            data.Pix = ToPixData(payment.PaymentPix);
        }

        if (payment.PaymentBoleto != null)
        {
            data.Boleto = ToBoletoData(payment, payment.PaymentBoleto);

            if (data.Pix == null && HasBoletoPixData(payment.PaymentBoleto))
            {
                data.Pix = ToPixData(payment.PaymentBoleto);
            }
        }

        return data;
    }

    private static bool HasBoletoPixData(swiftpay_api_core.Models.Database.PaymentBoleto paymentBoleto)
    {
        return !string.IsNullOrWhiteSpace(paymentBoleto.PixCopyAndPaste);
    }

    private static PixTransactionData ToPixData(swiftpay_api_core.Models.Database.PaymentPix paymentPix)
    {
        return new PixTransactionData
        {
            TxId = paymentPix.TxId,
            QrCode = paymentPix.QrCode,
            CopyAndPaste = paymentPix.CopyAndPaste,
            ExpiresAt = paymentPix.ExpiresAt
        };
    }

    private static PixTransactionData ToPixData(swiftpay_api_core.Models.Database.PaymentBoleto paymentBoleto)
    {
        return new PixTransactionData
        {
            TxId = null,
            QrCode = null,
            CopyAndPaste = paymentBoleto.PixCopyAndPaste,
            ExpiresAt = paymentBoleto.PixExpiresAt ?? paymentBoleto.DueDate
        };
    }

    private static BoletoTransactionData ToBoletoData(Payment payment, swiftpay_api_core.Models.Database.PaymentBoleto paymentBoleto)
    {
        return new BoletoTransactionData
        {
            Barcode = paymentBoleto.Barcode,
            DigitableLine = paymentBoleto.DigitableLine,
            PdfUrl = paymentBoleto.PdfUrl,
            RecipientName = paymentBoleto.RecipientName,
            RecipientDocument = MaskDocumentOrNull(paymentBoleto.RecipientDocument),
            PayerName = payment.Customer?.Name,
            PayerDocument = MaskDocumentOrNull(payment.Customer?.Document),
            PixCopyAndPaste = paymentBoleto.PixCopyAndPaste,
            PixExpiresAt = paymentBoleto.PixExpiresAt,
            DueDate = paymentBoleto.DueDate
        };
    }

    private static string? MaskDocumentOrNull(string? document)
    {
        var trimmed = document?.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
        {
            return null;
        }

        return MaskUtils.MaskDocument(trimmed);
    }
}
