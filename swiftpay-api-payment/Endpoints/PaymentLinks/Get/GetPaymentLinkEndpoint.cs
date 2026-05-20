using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Models.Calculation;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_core.Utils;
using safefy_api_payment.EndpointsGroups;
using safefy_api_payment.Endpoints.Transactions.Create;

namespace safefy_api_payment.Endpoints.PaymentLinks.Get;

public sealed class GetPaymentLinkEndpoint(
    PrimaryDbContext dbContext,
    IMerchantCalculationService calculationService
) : Endpoint<GetPaymentLinkRequest, GetPaymentLinkResponse>
{
    public override void Configure()
    {
        Get("{token}");
        Group<PaymentLinksGroup>();
        AllowAnonymous();
        Description(d => d
            .Produces<GetPaymentLinkResponse>(200, "application/json")
            .Produces<GetPaymentLinkResponse>(404, "application/json")
            .Produces<GetPaymentLinkResponse>(410, "application/json")
            .WithSummary("Obter pagamento por link")
            .WithDescription("Retorna os dados de um pagamento via link público. Não requer autenticação."));
    }

    public override async Task HandleAsync(GetPaymentLinkRequest req, CancellationToken ct)
    {
        var paymentLink = await dbContext.PaymentLinks
            .IgnoreQueryFilters()
            .Include(pl => pl.Payment)
                .ThenInclude(p => p!.PaymentPix)
            .Include(pl => pl.Payment)
                .ThenInclude(p => p!.PaymentBoleto)
            .Include(pl => pl.Payment)
                .ThenInclude(p => p!.Customer)
            .AsNoTracking()
            .OrderBy(pl => pl.Id)
            .FirstOrDefaultAsync(
                pl => pl.Token == req.Token
                   && (pl.Payment == null || !pl.Payment.SuppressMerchantVisibility),
                ct);

        if (paymentLink == null)
        {
            await Send.ResponseAsync(new GetPaymentLinkResponse
            {
                Error = new("Link de pagamento não encontrado.")
            }, 404, ct);
            return;
        }

        var payment = paymentLink.Payment;

        if (paymentLink.ExpiresAt.HasValue && paymentLink.ExpiresAt.Value < DateTime.UtcNow
            && (payment == null || payment.Status == PaymentStatus.Pending))
        {
            await Send.ResponseAsync(new GetPaymentLinkResponse
            {
                Error = new("Este link de pagamento expirou.")
            }, 410, ct);
            return;
        }

        var platformDbSettings = await dbContext.PlatformSettings
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(ct) ?? new PlatformSettings();

        var merchantSettings = await dbContext.MerchantSettings
            .AsNoTracking()
            .Where(ms => ms.MerchantId == paymentLink.MerchantId)
            .OrderBy(ms => ms.Id)
            .FirstOrDefaultAsync(ct);

        await Send.OkAsync(new GetPaymentLinkResponse
        {
            Data = await ToPaymentLinkDataAsync(paymentLink, platformDbSettings, merchantSettings, ct)
        }, ct);
    }

    private async Task<PaymentLinkData> ToPaymentLinkDataAsync(
        PaymentLink paymentLink,
        PlatformSettings platformSettings,
        MerchantSettings? merchantSettings,
        CancellationToken ct)
    {
        var isUnlimitedLink = !paymentLink.ExpiresAt.HasValue;
        var payment = isUnlimitedLink ? null : paymentLink.Payment;
        var enabledMethods = ParseEnabledMethods(paymentLink.EnabledMethods);
        var resolvedBranding = PlatformLinkResolver.ResolvePaymentLinkBranding(
            platformSettings,
            merchantSettings,
            payment?.Method,
            enabledMethods);

        var feeAmounts = new Dictionary<string, long>();
        foreach (var method in enabledMethods)
        {
            var settings = await calculationService.GetPaymentFeeSettingsAsync(
                paymentLink.MerchantId,
                method,
                PaymentFeeContext.PaymentLink,
                ct);
            feeAmounts[method.ToString()] = FeeCalculator.Calculate(
                paymentLink.Amount, settings.FeeMode, settings.FeeFixed, settings.FeePercentage);
        }

        var data = new PaymentLinkData
        {
            Id = payment?.Id ?? paymentLink.Id,
            PaymentLinkId = paymentLink.Id,
            PaymentId = payment?.Id,
            EnabledMethods = enabledMethods,
            Method = payment?.Method,
            Amount = payment?.Amount ?? paymentLink.Amount,
            Currency = payment?.Currency.ToString() ?? paymentLink.Currency,
            Status = payment?.Status ?? PaymentStatus.Pending,
            Description = payment?.Description ?? paymentLink.Description,
            Environment = payment?.Environment ?? paymentLink.Environment,
            ExpiresAt = payment?.ExpiresAt ?? paymentLink.ExpiresAt,
            CreatedAt = payment?.CreatedAt ?? paymentLink.CreatedAt,
            CompletedAt = payment?.CompletedAt,
            IsPaymentStarted = payment != null,
            IsUnlimitedLink = !paymentLink.ExpiresAt.HasValue,
            RedirectUrl = paymentLink.RedirectUrl,
            RequiredBuyerFields = ParseRequiredBuyerFields(paymentLink.RequiredBuyerFields),
            ShowFees = paymentLink.ShowFees,
            FeeAmounts = feeAmounts,
            PassFeeToCustomer = paymentLink.PassFeeToCustomer,
            ShowSafefyBranding = resolvedBranding?.ShowSafefyBranding ?? true,
            ThemeMode = paymentLink.ThemeMode,
            LogoUrl = paymentLink.LogoUrl,
            ProductName = paymentLink.ProductName,
            ProductImageUrl = paymentLink.ProductImageUrl
        };

        if (payment?.PaymentPix != null)
        {
            data.Pix = ToPixData(payment.PaymentPix);
        }

        if (payment?.PaymentBoleto != null)
        {
            data.Boleto = ToBoletoData(payment, payment.PaymentBoleto);

            if (data.Pix == null && HasBoletoPixData(payment.PaymentBoleto))
            {
                data.Pix = ToPixData(payment.PaymentBoleto);
            }
        }

        return data;
    }

    private static List<string> ParseRequiredBuyerFields(string? requiredBuyerFields)
    {
        if (string.IsNullOrWhiteSpace(requiredBuyerFields))
        {
            return [];
        }

        return requiredBuyerFields
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Distinct()
            .ToList();
    }

    private static List<PaymentMethod> ParseEnabledMethods(string enabledMethods)
    {
        if (string.IsNullOrWhiteSpace(enabledMethods))
        {
            return [PaymentMethod.Pix];
        }

        return enabledMethods
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(value => Enum.TryParse<PaymentMethod>(value, true, out var method) ? method : (PaymentMethod?)null)
            .Where(method => method.HasValue)
            .Select(method => method!.Value)
            .Distinct()
            .ToList();
    }

    private static bool HasBoletoPixData(safefy_api_core.Models.Database.PaymentBoleto paymentBoleto)
    {
        return !string.IsNullOrWhiteSpace(paymentBoleto.PixCopyAndPaste);
    }

    private static PixTransactionData ToPixData(safefy_api_core.Models.Database.PaymentPix paymentPix)
    {
        return new PixTransactionData
        {
            TxId = paymentPix.TxId,
            QrCode = paymentPix.QrCode,
            CopyAndPaste = paymentPix.CopyAndPaste,
            ExpiresAt = paymentPix.ExpiresAt
        };
    }

    private static PixTransactionData ToPixData(safefy_api_core.Models.Database.PaymentBoleto paymentBoleto)
    {
        return new PixTransactionData
        {
            TxId = null,
            QrCode = null,
            CopyAndPaste = paymentBoleto.PixCopyAndPaste,
            ExpiresAt = paymentBoleto.PixExpiresAt ?? paymentBoleto.DueDate
        };
    }

    private static BoletoTransactionData ToBoletoData(Payment payment, safefy_api_core.Models.Database.PaymentBoleto paymentBoleto)
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
