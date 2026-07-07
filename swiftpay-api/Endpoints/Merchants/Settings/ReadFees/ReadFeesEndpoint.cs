using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Merchants.Settings.ReadFees;

public sealed class ReadFeesEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadFeesRequest, ReadFeesResponse>
{
    public override void Configure()
    {
        Get("{merchantId:guid}/fees");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadFeesRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadFeesResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .Include(m => m.MerchantSettings)
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new ReadFeesResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var platformSettings = await dbContext.PlatformSettings.OrderBy(p => p.Id).FirstOrDefaultAsync(ct);

        if (platformSettings == null)
        {
            await Send.ResponseAsync(new ReadFeesResponse
            {
                Error = new("Configurações da plataforma não encontradas.")
            }, 500, ct);
            return;
        }

        // Buscar o MerchantAcquirer ativo para determinar operações habilitadas
        var merchantAcquirer = await dbContext.MerchantAcquirers
            .Include(ma => ma.Acquirer)
            .FirstOrDefaultAsync(ma => ma.MerchantId == req.MerchantId && ma.IsActive, ct);

        var settings = merchant.MerchantSettings;
        var pixEnabledBySettings = settings?.PixEnabled ?? platformSettings.PixEnabled;
        var boletoEnabledBySettings = settings?.BoletoEnabled ?? platformSettings.BoletoEnabled;
        var creditCardEnabledBySettings = settings?.CreditCardEnabled ?? platformSettings.CreditCardEnabled;
        var withdrawalEnabledBySettings = settings?.WithdrawalEnabled ?? platformSettings.WithdrawalEnabled;

        var data = new ReadFeesData
        {
            // Operações habilitadas (baseado no MerchantAcquirer)
            PixEnabled = (merchantAcquirer?.IsPixEnabled() ?? false) && pixEnabledBySettings,
            BoletoEnabled = (merchantAcquirer?.IsBoletoEnabled() ?? false) && boletoEnabledBySettings,
            CreditCardEnabled = (merchantAcquirer?.IsCreditCardEnabled() ?? false) && creditCardEnabledBySettings,
            WithdrawalEnabled = (merchantAcquirer?.Acquirer?.SupportsWithdrawal ?? false) && withdrawalEnabledBySettings,
            PixCompensationDays = settings?.PixReserveCompensationDays ?? platformSettings.PixReserveCompensationDays,
            BoletoCompensationDays = settings?.BoletoReserveCompensationDays ?? platformSettings.BoletoReserveCompensationDays,
            CreditCardCompensationDays = settings?.CreditCardReserveCompensationDays ?? platformSettings.CreditCardReserveCompensationDays,
            PixReservePercentage = settings?.PixReservePercentage ?? platformSettings.PixReservePercentage,
            BoletoReservePercentage = settings?.BoletoReservePercentage ?? platformSettings.BoletoReservePercentage,
            CreditCardReservePercentage = settings?.CreditCardReservePercentage ?? platformSettings.CreditCardReservePercentage,
            
            PixMinTransactionAmount = settings?.PixMinTransactionAmount ?? platformSettings.PixMinTransactionAmount,
            PixMaxTransactionAmount = settings?.PixMaxTransactionAmount ?? platformSettings.PixMaxTransactionAmount,
            BoletoMinTransactionAmount = settings?.BoletoMinTransactionAmount ?? platformSettings.BoletoMinTransactionAmount,
            BoletoMaxTransactionAmount = settings?.BoletoMaxTransactionAmount ?? platformSettings.BoletoMaxTransactionAmount,
            PixApiFeeMode = settings?.PixApiFeeMode ?? platformSettings.PixApiFeeMode,
            PixApiFeeFixed = settings?.PixApiFeeFixed ?? platformSettings.PixApiFeeFixed,
            PixApiFeePercentage = settings?.PixApiFeePercentage ?? platformSettings.PixApiFeePercentage,
            PixCheckoutFeeMode = settings?.PixCheckoutFeeMode ?? platformSettings.PixCheckoutFeeMode,
            PixCheckoutFeeFixed = settings?.PixCheckoutFeeFixed ?? platformSettings.PixCheckoutFeeFixed,
            PixCheckoutFeePercentage = settings?.PixCheckoutFeePercentage ?? platformSettings.PixCheckoutFeePercentage,
            PixPaymentLinkFeeMode = settings?.PixPaymentLinkFeeMode ?? platformSettings.PixPaymentLinkFeeMode,
            PixPaymentLinkFeeFixed = settings?.PixPaymentLinkFeeFixed ?? platformSettings.PixPaymentLinkFeeFixed,
            PixPaymentLinkFeePercentage = settings?.PixPaymentLinkFeePercentage ?? platformSettings.PixPaymentLinkFeePercentage,
            BoletoApiFeeMode = settings?.BoletoApiFeeMode ?? platformSettings.BoletoApiFeeMode,
            BoletoApiFeeFixed = settings?.BoletoApiFeeFixed ?? platformSettings.BoletoApiFeeFixed,
            BoletoApiFeePercentage = settings?.BoletoApiFeePercentage ?? platformSettings.BoletoApiFeePercentage,
            CreditCardApiFeeMode = settings?.CreditCardApiFeeMode ?? platformSettings.CreditCardApiFeeMode,
            CreditCardApiFeeFixed = settings?.CreditCardApiFeeFixed ?? platformSettings.CreditCardApiFeeFixed,
            CreditCardApiFeePercentage = settings?.CreditCardApiFeePercentage ?? platformSettings.CreditCardApiFeePercentage,
            BoletoCheckoutFeeMode = settings?.BoletoCheckoutFeeMode ?? platformSettings.BoletoCheckoutFeeMode,
            BoletoCheckoutFeeFixed = settings?.BoletoCheckoutFeeFixed ?? platformSettings.BoletoCheckoutFeeFixed,
            BoletoCheckoutFeePercentage = settings?.BoletoCheckoutFeePercentage ?? platformSettings.BoletoCheckoutFeePercentage,
            BoletoPaymentLinkFeeMode = settings?.BoletoPaymentLinkFeeMode ?? platformSettings.BoletoPaymentLinkFeeMode,
            BoletoPaymentLinkFeeFixed = settings?.BoletoPaymentLinkFeeFixed ?? platformSettings.BoletoPaymentLinkFeeFixed,
            BoletoPaymentLinkFeePercentage = settings?.BoletoPaymentLinkFeePercentage ?? platformSettings.BoletoPaymentLinkFeePercentage,
            CreditCardCheckoutFeeMode = settings?.CreditCardCheckoutFeeMode ?? platformSettings.CreditCardCheckoutFeeMode,
            CreditCardCheckoutFeeFixed = settings?.CreditCardCheckoutFeeFixed ?? platformSettings.CreditCardCheckoutFeeFixed,
            CreditCardCheckoutFeePercentage = settings?.CreditCardCheckoutFeePercentage ?? platformSettings.CreditCardCheckoutFeePercentage,
            CreditCardPaymentLinkFeeMode = settings?.CreditCardPaymentLinkFeeMode ?? platformSettings.CreditCardPaymentLinkFeeMode,
            CreditCardPaymentLinkFeeFixed = settings?.CreditCardPaymentLinkFeeFixed ?? platformSettings.CreditCardPaymentLinkFeeFixed,
            CreditCardPaymentLinkFeePercentage = settings?.CreditCardPaymentLinkFeePercentage ?? platformSettings.CreditCardPaymentLinkFeePercentage,
            WithdrawalFeeMode = settings?.WithdrawalFeeMode ?? platformSettings.WithdrawalFeeMode,
            WithdrawalFeeFixed = settings?.WithdrawalFeeFixed ?? platformSettings.WithdrawalFeeFixed,
            WithdrawalFeePercentage = settings?.WithdrawalFeePercentage ?? platformSettings.WithdrawalFeePercentage,
            MinWithdrawalAmount = settings?.MinWithdrawalAmount ?? platformSettings.MinWithdrawalAmount,
            WithdrawalApprovalMode = settings?.WithdrawalApprovalMode ?? platformSettings.WithdrawalApprovalMode,
            RateLimitPerMinute = settings?.RateLimitPerMinute ?? platformSettings.RateLimitPerMinute,
            RateLimitPerHour = settings?.RateLimitPerHour ?? platformSettings.RateLimitPerHour,
            RateLimitPerDay = settings?.RateLimitPerDay ?? platformSettings.RateLimitPerDay
        };

        await Send.OkAsync(new ReadFeesResponse
        {
            Data = data
        }, ct);
    }
}
