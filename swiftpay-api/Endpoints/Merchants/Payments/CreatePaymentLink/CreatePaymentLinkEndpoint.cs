using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api.EndpointsGroups;
using swiftpay_api.Interfaces;
using swiftpay_api.Models.PaymentApi;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Merchants.Payments.CreatePaymentLink;

public sealed class CreatePaymentLinkEndpoint(
    PrimaryDbContext dbContext,
    IPaymentApiClient paymentApiClient,
    IEnvironmentProvider environmentProvider
) : Endpoint<CreatePaymentLinkRequest, CreatePaymentLinkResponse>
{
    public override void Configure()
    {
        Post("{merchantId:guid}/payment-links");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(CreatePaymentLinkRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new CreatePaymentLinkResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new CreatePaymentLinkResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        if (req.EnabledMethods.Contains(PaymentMethod.CreditCard))
        {
            await Send.ResponseAsync(new CreatePaymentLinkResponse
            {
                Error = new("Pagamento com cartão de crédito ainda não está disponível.")
            }, 400, ct);
            return;
        }

        var platformSettings = await dbContext.PlatformSettings
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(ct) ?? new PlatformSettings();

        var merchantSettings = await dbContext.MerchantSettings
            .AsNoTracking()
            .Where(ms => ms.MerchantId == req.MerchantId)
            .OrderBy(ms => ms.Id)
            .FirstOrDefaultAsync(ct);

        var pixEnabled = merchantSettings?.PixEnabled ?? platformSettings.PixEnabled;
        var boletoEnabled = merchantSettings?.BoletoEnabled ?? platformSettings.BoletoEnabled;

        if (req.EnabledMethods.Contains(PaymentMethod.Pix) && !pixEnabled)
        {
            await Send.ResponseAsync(new CreatePaymentLinkResponse
            {
                Error = new("PIX está desabilitado para esta organização.")
            }, 400, ct);
            return;
        }

        if (req.EnabledMethods.Contains(PaymentMethod.Boleto) && !boletoEnabled)
        {
            await Send.ResponseAsync(new CreatePaymentLinkResponse
            {
                Error = new("Boleto está desabilitado para esta organização.")
            }, 400, ct);
            return;
        }

        var enabledMins = new List<long>();
        var enabledMaxes = new List<long>();

        if (req.EnabledMethods.Contains(PaymentMethod.Pix))
        {
            enabledMins.Add(merchantSettings?.PixMinTransactionAmount ?? platformSettings.PixMinTransactionAmount);
            enabledMaxes.Add(merchantSettings?.PixMaxTransactionAmount ?? platformSettings.PixMaxTransactionAmount);
        }

        if (req.EnabledMethods.Contains(PaymentMethod.Boleto))
        {
            enabledMins.Add(merchantSettings?.BoletoMinTransactionAmount ?? platformSettings.BoletoMinTransactionAmount);
            enabledMaxes.Add(merchantSettings?.BoletoMaxTransactionAmount ?? platformSettings.BoletoMaxTransactionAmount);
        }

        var effectiveMinAmount = enabledMins.Count > 0 ? enabledMins.Max() : platformSettings.PixMinTransactionAmount;
        var effectiveMaxAmount = enabledMaxes.Count > 0 ? enabledMaxes.Min() : platformSettings.PixMaxTransactionAmount;

        if (req.Amount < effectiveMinAmount)
        {
            await Send.ResponseAsync(new CreatePaymentLinkResponse
            {
                Error = new($"Valor abaixo do mínimo permitido para os métodos selecionados. Mínimo: R$ {effectiveMinAmount / 100.0m:N2}.")
            }, 400, ct);
            return;
        }

        if (effectiveMaxAmount > 0 && req.Amount > effectiveMaxAmount)
        {
            await Send.ResponseAsync(new CreatePaymentLinkResponse
            {
                Error = new($"Valor acima do máximo permitido para os métodos selecionados. Máximo: R$ {effectiveMaxAmount / 100.0m:N2}.")
            }, 400, ct);
            return;
        }

        var result = await paymentApiClient.CreatePaymentLinkAsync(new CreatePaymentLinkApiInput
        {
            MerchantId = req.MerchantId,
            UserId = userId.Value,
            Environment = environmentProvider.CurrentEnvironment,
            EnabledMethods = req.EnabledMethods,
            Amount = req.Amount ?? 0,
            Currency = CurrencyType.BRL,
            Description = req.Description,
            CustomerId = req.CustomerId,
            CallbackUrl = req.CallbackUrl,
            PixExpirationMinutes = req.PixExpirationMinutes,
            BoletoDueDate = req.BoletoDueDate,
            BoletoInstructions = req.BoletoInstructions,
            RedirectUrl = req.RedirectUrl,
            RequiredBuyerFields = req.RequiredBuyerFields != null && req.RequiredBuyerFields.Count > 0
                ? string.Join(',', req.RequiredBuyerFields)
                : null,
            ShowFees = req.ShowFees,
            PassFeeToCustomer = req.PassFeeToCustomer,
            ExpiresAt = req.ExpiresAt,
            PrimaryColor = req.PrimaryColor,
            SecondaryColor = req.SecondaryColor,
            LogoUrl = req.LogoUrl,
            ColorMode = req.ColorMode,
            ThemeMode = req.ThemeMode,
            ProductName = req.ProductName,
            ProductImageUrl = req.ProductImageUrl,
            PixLinkMode = req.PixLinkMode
        }, ct);

        if (!result.Success)
        {
            await Send.ResponseAsync(new CreatePaymentLinkResponse
            {
                Error = new(result.ErrorMessage ?? "Erro ao criar link de pagamento.")
            }, 400, ct);
            return;
        }

        if (result.PaymentLinkId == null || string.IsNullOrWhiteSpace(result.PaymentLinkUrl))
        {
            await Send.ResponseAsync(new CreatePaymentLinkResponse
            {
                Error = new("A API de pagamentos não retornou um link válido.")
            }, 500, ct);
            return;
        }

        await Send.ResponseAsync(new CreatePaymentLinkResponse
        {
            Data = new CreatePaymentLinkData
            {
                PaymentLinkId = result.PaymentLinkId.Value,
                PaymentLinkUrl = result.PaymentLinkUrl,
                EnabledMethods = result.EnabledMethods.Count > 0 ? result.EnabledMethods : req.EnabledMethods,
                Amount = result.Amount ?? req.Amount,
                Currency = result.Currency ?? CurrencyType.BRL,
                Description = result.Description,
                Environment = result.Environment ?? environmentProvider.CurrentEnvironment,
                ExpiresAt = result.ExpiresAt,
                CreatedAt = result.CreatedAt ?? DateTime.UtcNow,
                CustomerId = result.CustomerId,
                RedirectUrl = result.RedirectUrl,
                RequiredBuyerFields = !string.IsNullOrWhiteSpace(result.RequiredBuyerFields)
                    ? result.RequiredBuyerFields.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList()
                    : [],
                ShowFees = result.ShowFees,
                PassFeeToCustomer = result.PassFeeToCustomer,
                PrimaryColor = result.PrimaryColor,
                SecondaryColor = result.SecondaryColor,
                LogoUrl = result.LogoUrl,
                ColorMode = result.ColorMode,
                ThemeMode = result.ThemeMode,
                ProductName = result.ProductName,
                ProductImageUrl = result.ProductImageUrl
            },
            Message = "Link de pagamento criado com sucesso!"
        }, 201, ct);
    }
}
