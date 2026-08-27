using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Utils;
using swiftpay_api_payment.EndpointsGroups;

namespace swiftpay_api_payment.Endpoints.Internal.PaymentLinks.Create;

public sealed class CreatePaymentLinkInternalEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<CreatePaymentLinkInternalRequest, CreatePaymentLinkInternalResponse>
{
    public override void Configure()
    {
        Post("");
        Group<InternalPaymentLinksGroup>();
    }

    public override async Task HandleAsync(CreatePaymentLinkInternalRequest req, CancellationToken ct)
    {
        var platformDbSettings = await dbContext.PlatformSettings
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(ct) ?? new PlatformSettings();

        var merchantSettings = await dbContext.MerchantSettings
            .AsNoTracking()
            .Where(ms => ms.MerchantId == req.MerchantId)
            .OrderBy(ms => ms.Id)
            .FirstOrDefaultAsync(ct);

        var enabledMins = new List<long>();
        var enabledMaxes = new List<long>();

        if (req.EnabledMethods.Contains(PaymentMethod.Pix))
        {
            enabledMins.Add(merchantSettings?.PixMinTransactionAmount ?? platformDbSettings.PixMinTransactionAmount);
            enabledMaxes.Add(merchantSettings?.PixMaxTransactionAmount ?? platformDbSettings.PixMaxTransactionAmount);
        }

        if (req.EnabledMethods.Contains(PaymentMethod.Boleto))
        {
            enabledMins.Add(merchantSettings?.BoletoMinTransactionAmount ?? platformDbSettings.BoletoMinTransactionAmount);
            enabledMaxes.Add(merchantSettings?.BoletoMaxTransactionAmount ?? platformDbSettings.BoletoMaxTransactionAmount);
        }

        if (req.EnabledMethods.Contains(PaymentMethod.CreditCard))
        {
            enabledMins.Add(merchantSettings?.PixMinTransactionAmount ?? platformDbSettings.PixMinTransactionAmount);
            enabledMaxes.Add(merchantSettings?.PixMaxTransactionAmount ?? platformDbSettings.PixMaxTransactionAmount);
        }

        var effectiveMinAmount = enabledMins.Count > 0 ? enabledMins.Max() : platformDbSettings.PixMinTransactionAmount;
        var effectiveMaxAmount = enabledMaxes.Count > 0 ? enabledMaxes.Min() : platformDbSettings.PixMaxTransactionAmount;

        // Estático aberto/portável não exige valor mínimo/máximo
        if (req.PixLinkMode is PixLinkMode.Dynamic && req.Amount < effectiveMinAmount)
        {
            await Send.ResponseAsync(new CreatePaymentLinkInternalResponse
            {
                Success = false,
                ErrorCode = "amount_below_minimum",
                ErrorMessage = $"Valor abaixo do mínimo permitido para os métodos selecionados. Mínimo: R$ {effectiveMinAmount / 100.0m:N2}."
            }, 400, ct);
            return;
        }

        if (req.PixLinkMode is PixLinkMode.Dynamic && effectiveMaxAmount > 0 && req.Amount > effectiveMaxAmount)
        {
            await Send.ResponseAsync(new CreatePaymentLinkInternalResponse
            {
                Success = false,
                ErrorCode = "amount_above_maximum",
                ErrorMessage = $"Valor acima do máximo permitido para os métodos selecionados. Máximo: R$ {effectiveMaxAmount / 100.0m:N2}."
            }, 400, ct);
            return;
        }

        var token = $"pay_{CryptoUtils.GenerateToken()}";
        var boletoDueDateUtc = ToUtcDateTime(req.BoletoDueDate);
        var expiresAtUtc = ToUtcDateTime(req.ExpiresAt);
        // Estático não usa expiração
        if (req.PixLinkMode != PixLinkMode.Dynamic)
        {
            expiresAtUtc = null;
        }

       var paymentLink = new PaymentLink
       {
           MerchantId = req.MerchantId,
           Token = token,
           Amount = req.Amount ?? 0,
           Currency = req.Currency.ToString(),
           Description = req.Description,
           CustomerId = req.CustomerId,
           CallbackUrl = req.CallbackUrl,
           EnabledMethods = string.Join(',', req.EnabledMethods.Select(method => method.ToString())),
           PixExpirationMinutes = req.PixExpirationMinutes,
           BoletoDueDate = boletoDueDateUtc,
           BoletoInstructions = req.BoletoInstructions,
           Environment = req.Environment,
           ExpiresAt = expiresAtUtc,
           RedirectUrl = req.RedirectUrl,
           RequiredBuyerFields = req.RequiredBuyerFields,
           ShowFees = req.ShowFees,
           PassFeeToCustomer = req.PassFeeToCustomer,
           PrimaryColor = NullIfWhiteSpace(req.PrimaryColor),
           SecondaryColor = NullIfWhiteSpace(req.SecondaryColor),
           LogoUrl = NullIfWhiteSpace(req.LogoUrl),
           ColorMode = NullIfWhiteSpace(req.ColorMode),
           ThemeMode = NullIfWhiteSpace(req.ThemeMode),
           ProductName = req.ProductName,
           ProductImageUrl = req.ProductImageUrl,
           PixLinkMode = req.PixLinkMode
       };


        dbContext.PaymentLinks.Add(paymentLink);
        await dbContext.SaveChangesAsync(ct);

        var paymentLinkUrl = PlatformLinkResolver.BuildPaymentLinkUrl(
            platformDbSettings,
            token,
            null,
            req.EnabledMethods,
            merchantSettings);

        var response = new CreatePaymentLinkInternalResponse
        {
            Success = true,
            PaymentLinkId = paymentLink.Id,
            PaymentLinkUrl = paymentLinkUrl,
            EnabledMethods = req.EnabledMethods.Select(method => method.ToString()).ToList(),
            Amount = paymentLink.Amount,
            Currency = paymentLink.Currency,
            Description = paymentLink.Description,
            Environment = paymentLink.Environment.ToString(),
            ExpiresAt = paymentLink.ExpiresAt,
            CreatedAt = paymentLink.CreatedAt,
            CustomerId = paymentLink.CustomerId,
            RedirectUrl = paymentLink.RedirectUrl,
            RequiredBuyerFields = paymentLink.RequiredBuyerFields,
            ShowFees = paymentLink.ShowFees,
            PassFeeToCustomer = paymentLink.PassFeeToCustomer,
            PrimaryColor = paymentLink.PrimaryColor,
            SecondaryColor = paymentLink.SecondaryColor,
            LogoUrl = paymentLink.LogoUrl,
            ColorMode = paymentLink.ColorMode,
            ThemeMode = paymentLink.ThemeMode,
            ProductName = paymentLink.ProductName,
            ProductImageUrl = paymentLink.ProductImageUrl
        };

        await Send.ResponseAsync(response, 201, ct);
    }

    private static string? NullIfWhiteSpace(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static DateTime? ToUtcDateTime(DateTime? value)
    {
        if (!value.HasValue)
        {
            return null;
        }

        var dateTime = value.Value;

        return dateTime.Kind switch
        {
            DateTimeKind.Utc => dateTime,
            DateTimeKind.Local => dateTime.ToUniversalTime(),
            _ => DateTime.SpecifyKind(dateTime, DateTimeKind.Utc)
        };
    }
}
