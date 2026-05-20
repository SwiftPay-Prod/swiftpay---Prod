using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.Endpoints.Merchants.Payments.ReadPaymentLink;
using safefy_api.EndpointsGroups;
using safefy_api_core.Database;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Merchants.Payments.UpdatePaymentLink;

public sealed class UpdatePaymentLinkEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<UpdatePaymentLinkRequest, UpdatePaymentLinkResponse>
{
    public override void Configure()
    {
        Patch("{merchantId:guid}/payment-links/{paymentLinkId:guid}");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(UpdatePaymentLinkRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new UpdatePaymentLinkResponse
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
            await Send.ResponseAsync(new UpdatePaymentLinkResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        if (merchant.Status != MerchantStatus.Active)
        {
            await Send.ResponseAsync(new UpdatePaymentLinkResponse
            {
                Error = new("Organização não está ativa.")
            }, 403, ct);
            return;
        }

        var paymentLink = await dbContext.PaymentLinks
            .Include(pl => pl.Payment!)
                .ThenInclude(p => p.Customer)
            .FirstOrDefaultAsync(
                pl => pl.Id == req.PaymentLinkId && pl.MerchantId == req.MerchantId,
                ct);

        if (paymentLink == null)
        {
            await Send.ResponseAsync(new UpdatePaymentLinkResponse
            {
                Error = new("Link de pagamento não encontrado.")
            }, 404, ct);
            return;
        }

        var payment = paymentLink.Payment;
        if (payment != null && payment.Status != PaymentStatus.Pending)
        {
            await Send.ResponseAsync(new UpdatePaymentLinkResponse
            {
                Error = new("Não é possível editar um link que já foi processado.")
            }, 400, ct);
            return;
        }

        if (req.EnabledMethods.Contains(PaymentMethod.CreditCard))
        {
            await Send.ResponseAsync(new UpdatePaymentLinkResponse
            {
                Error = new("Pagamento com cartão de crédito ainda não está disponível.")
            }, 400, ct);
            return;
        }

        paymentLink.EnabledMethods = string.Join(",", req.EnabledMethods.Select(m => m.ToString()));
        paymentLink.Amount = req.Amount;
        paymentLink.Description = req.Description;
        paymentLink.CallbackUrl = req.CallbackUrl;
        paymentLink.PixExpirationMinutes = req.PixExpirationMinutes;
        paymentLink.BoletoDueDate = string.IsNullOrWhiteSpace(req.BoletoDueDate)
            ? null
            : (DateTime.TryParse(req.BoletoDueDate, out var dueDate) ? dueDate : null);
        paymentLink.BoletoInstructions = req.BoletoInstructions;
        paymentLink.RedirectUrl = req.RedirectUrl;
        paymentLink.RequiredBuyerFields = req.RequiredBuyerFields is { Count: > 0 }
            ? string.Join(',', req.RequiredBuyerFields)
            : null;
        paymentLink.ShowFees = req.ShowFees;
        paymentLink.PassFeeToCustomer = req.PassFeeToCustomer;
        paymentLink.ExpiresAt = req.ExpiresAt;
        paymentLink.PrimaryColor = req.PrimaryColor;
        paymentLink.SecondaryColor = req.SecondaryColor;
        paymentLink.LogoUrl = req.LogoUrl;
        paymentLink.ColorMode = req.ColorMode;
        paymentLink.ThemeMode = req.ThemeMode;
        paymentLink.ProductName = req.ProductName;
        paymentLink.ProductImageUrl = req.ProductImageUrl;

        await dbContext.SaveChangesAsync(ct);

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

        await Send.OkAsync(new UpdatePaymentLinkResponse
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
}
