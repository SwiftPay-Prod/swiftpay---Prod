using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.Endpoints.Models;
using safefy_api.EndpointsGroups;
using safefy_api_core.Database;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Merchants.Payments.ReadPaymentLink;

public sealed class ReadPaymentLinkEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadPaymentLinkRequest, ReadPaymentLinkResponse>
{
    public override void Configure()
    {
        Get("{merchantId:guid}/payment-links/{paymentLinkId:guid}");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadPaymentLinkRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadPaymentLinkResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .AsNoTracking()
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new ReadPaymentLinkResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        if (merchant.Status != MerchantStatus.Active)
        {
            await Send.ResponseAsync(new ReadPaymentLinkResponse
            {
                Error = new("Organização não está ativa.")
            }, 403, ct);
            return;
        }

        var paymentLink = await dbContext.PaymentLinks
            .AsNoTracking()
            .Include(pl => pl.Payment!)
                .ThenInclude(p => p.Customer)
            .FirstOrDefaultAsync(
                pl => pl.Id == req.PaymentLinkId
                   && pl.MerchantId == req.MerchantId
                   && (pl.Payment == null || !pl.Payment.SuppressMerchantVisibility),
                ct);

        if (paymentLink == null)
        {
            await Send.ResponseAsync(new ReadPaymentLinkResponse
            {
                Error = new("Link de pagamento não encontrado.")
            }, 404, ct);
            return;
        }

        var platformDbSettings = await dbContext.PlatformSettings
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(ct) ?? new PlatformSettings();

        var merchantSettings = await dbContext.MerchantSettings
            .AsNoTracking()
            .Where(ms => ms.MerchantId == req.MerchantId)
            .OrderBy(ms => ms.Id)
            .FirstOrDefaultAsync(ct);

        var enabledMethods = ParseEnabledMethods(paymentLink.EnabledMethods);
        var fallbackMethod = enabledMethods.FirstOrDefault();
        var paymentLinkUrl = PlatformLinkResolver.BuildPaymentLinkUrl(
            platformDbSettings,
            paymentLink.Token,
            paymentLink.Payment?.Method ?? fallbackMethod,
            enabledMethods,
            merchantSettings);

        var payment = paymentLink.Payment;

        var requiredBuyerFields = string.IsNullOrWhiteSpace(paymentLink.RequiredBuyerFields)
            ? []
            : paymentLink.RequiredBuyerFields
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .ToList();

        var boletoDueDate = paymentLink.BoletoDueDate.HasValue
            ? paymentLink.BoletoDueDate.Value.ToString("yyyy-MM-dd")
            : null;

        var details = new PaymentLinkDetails
        {
            Id = paymentLink.Id,
            PaymentId = paymentLink.PaymentId,
            PaymentLinkUrl = paymentLinkUrl,
            Amount = payment?.Amount ?? paymentLink.Amount,
            Method = payment?.Method ?? fallbackMethod,
            EnabledMethods = enabledMethods,
            Status = payment?.Status ?? PaymentStatus.Pending,
            Description = payment?.Description ?? paymentLink.Description,
            CreatedAt = paymentLink.CreatedAt,
            ExpiresAt = paymentLink.ExpiresAt,
            IsExpired = paymentLink.ExpiresAt.HasValue && paymentLink.ExpiresAt.Value < DateTime.UtcNow,
            LifetimeStatus = GetLifetimeStatus(paymentLink.ExpiresAt),
            Customer = payment?.Customer != null
                ? new PaymentLinkDetailsCustomer
                {
                    Id = payment.Customer.Id,
                    Name = payment.Customer.Name,
                    Email = payment.Customer.Email
                }
                : null,
            Environment = paymentLink.Environment,
            ShowFees = paymentLink.ShowFees,
            PassFeeToCustomer = paymentLink.PassFeeToCustomer,
            RequiredBuyerFields = requiredBuyerFields,
            RedirectUrl = paymentLink.RedirectUrl,
            CallbackUrl = paymentLink.CallbackUrl,
            PixExpirationMinutes = paymentLink.PixExpirationMinutes,
            BoletoDueDate = boletoDueDate,
            BoletoInstructions = paymentLink.BoletoInstructions,
            PrimaryColor = paymentLink.PrimaryColor,
            SecondaryColor = paymentLink.SecondaryColor,
            LogoUrl = paymentLink.LogoUrl,
            ColorMode = paymentLink.ColorMode,
            ThemeMode = paymentLink.ThemeMode,
            ProductName = paymentLink.ProductName,
            ProductImageUrl = paymentLink.ProductImageUrl
        };

        await Send.OkAsync(new ReadPaymentLinkResponse
        {
            Data = details
        }, ct);
    }

    private static List<PaymentMethod> ParseEnabledMethods(string enabledMethods)
    {
        if (string.IsNullOrWhiteSpace(enabledMethods))
            return [PaymentMethod.Pix];

        return enabledMethods
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(value => Enum.TryParse<PaymentMethod>(value, true, out var method) ? method : (PaymentMethod?)null)
            .Where(m => m.HasValue)
            .Select(m => m!.Value)
            .Distinct()
            .ToList();
    }

    private static string GetLifetimeStatus(DateTime? expiresAt)
    {
        if (!expiresAt.HasValue)
        {
            return "NeverExpires";
        }

        return expiresAt.Value < DateTime.UtcNow ? "Expired" : "Active";
    }
}
