using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Calculation;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Utils;

namespace swiftpay_api_core.Services;

public sealed class MerchantCalculationService(
    PrimaryDbContext dbContext,
    ILedgerService ledgerService,
    ICalculationService calculationService) : IMerchantCalculationService
{
    public async Task<MerchantWithdrawalFeeSettings> GetWithdrawalFeeSettingsAsync(
        Guid merchantId,
        CancellationToken ct = default)
    {
        var (platform, merchant) = await GetSettingsAsync(merchantId, ct);

        return MerchantWithdrawalFeeSettings.Resolve(merchant, platform);
    }

    public async Task<MerchantPaymentFeeSettings> GetPaymentFeeSettingsAsync(
        Guid merchantId,
        PaymentMethod method,
        PaymentFeeContext feeContext = PaymentFeeContext.Api,
        CancellationToken ct = default,
        int installments = 1)
    {
        var (platform, merchant) = await GetSettingsAsync(merchantId, ct);

        return method switch
        {
            PaymentMethod.Boleto when feeContext == PaymentFeeContext.Checkout => new MerchantPaymentFeeSettings(
                FeeMode: merchant?.BoletoCheckoutFeeMode ?? platform.BoletoCheckoutFeeMode,
                FeeFixed: merchant?.BoletoCheckoutFeeFixed ?? platform.BoletoCheckoutFeeFixed,
                FeePercentage: merchant?.BoletoCheckoutFeePercentage ?? platform.BoletoCheckoutFeePercentage,
                InstallmentFeePercentage: 0,
                ReservePercentage: merchant?.BoletoReservePercentage ?? platform.BoletoReservePercentage,
                ReserveCompensationDays: merchant?.BoletoReserveCompensationDays ?? platform.BoletoReserveCompensationDays,
                MinTransactionAmount: merchant?.BoletoMinTransactionAmount ?? platform.BoletoMinTransactionAmount,
                MaxTransactionAmount: merchant?.BoletoMaxTransactionAmount ?? platform.BoletoMaxTransactionAmount),

            PaymentMethod.Boleto when feeContext == PaymentFeeContext.PaymentLink => new MerchantPaymentFeeSettings(
                FeeMode: merchant?.BoletoPaymentLinkFeeMode ?? platform.BoletoPaymentLinkFeeMode,
                FeeFixed: merchant?.BoletoPaymentLinkFeeFixed ?? platform.BoletoPaymentLinkFeeFixed,
                FeePercentage: merchant?.BoletoPaymentLinkFeePercentage ?? platform.BoletoPaymentLinkFeePercentage,
                InstallmentFeePercentage: 0,
                ReservePercentage: merchant?.BoletoReservePercentage ?? platform.BoletoReservePercentage,
                ReserveCompensationDays: merchant?.BoletoReserveCompensationDays ?? platform.BoletoReserveCompensationDays,
                MinTransactionAmount: merchant?.BoletoMinTransactionAmount ?? platform.BoletoMinTransactionAmount,
                MaxTransactionAmount: merchant?.BoletoMaxTransactionAmount ?? platform.BoletoMaxTransactionAmount),

            PaymentMethod.Boleto => new MerchantPaymentFeeSettings(
                FeeMode: merchant?.BoletoApiFeeMode ?? platform.BoletoApiFeeMode,
                FeeFixed: merchant?.BoletoApiFeeFixed ?? platform.BoletoApiFeeFixed,
                FeePercentage: merchant?.BoletoApiFeePercentage ?? platform.BoletoApiFeePercentage,
                InstallmentFeePercentage: 0,
                ReservePercentage: merchant?.BoletoReservePercentage ?? platform.BoletoReservePercentage,
                ReserveCompensationDays: merchant?.BoletoReserveCompensationDays ?? platform.BoletoReserveCompensationDays,
                MinTransactionAmount: merchant?.BoletoMinTransactionAmount ?? platform.BoletoMinTransactionAmount,
                MaxTransactionAmount: merchant?.BoletoMaxTransactionAmount ?? platform.BoletoMaxTransactionAmount),

            PaymentMethod.CreditCard when feeContext == PaymentFeeContext.Checkout => new MerchantPaymentFeeSettings(
                FeeMode: merchant?.CreditCardCheckoutFeeMode ?? platform.CreditCardCheckoutFeeMode,
                FeeFixed: merchant?.CreditCardCheckoutFeeFixed ?? platform.CreditCardCheckoutFeeFixed,
                FeePercentage: ResolveEffectiveCardFeePercentage(
                    merchant?.CreditCardCheckoutFeePercentage ?? platform.CreditCardCheckoutFeePercentage,
                    merchant?.CreditCardCheckoutInstallmentFeePercentage ?? platform.CreditCardCheckoutInstallmentFeePercentage,
                    installments),
                InstallmentFeePercentage: merchant?.CreditCardCheckoutInstallmentFeePercentage ?? platform.CreditCardCheckoutInstallmentFeePercentage,
                ReservePercentage: merchant?.CreditCardReservePercentage ?? platform.CreditCardReservePercentage,
                ReserveCompensationDays: merchant?.CreditCardReserveCompensationDays ?? platform.CreditCardReserveCompensationDays,
                MinTransactionAmount: merchant?.PixMinTransactionAmount ?? platform.PixMinTransactionAmount,
                MaxTransactionAmount: merchant?.PixMaxTransactionAmount ?? platform.PixMaxTransactionAmount),

            PaymentMethod.CreditCard when feeContext == PaymentFeeContext.PaymentLink => new MerchantPaymentFeeSettings(
                FeeMode: merchant?.CreditCardPaymentLinkFeeMode ?? platform.CreditCardPaymentLinkFeeMode,
                FeeFixed: merchant?.CreditCardPaymentLinkFeeFixed ?? platform.CreditCardPaymentLinkFeeFixed,
                FeePercentage: ResolveEffectiveCardFeePercentage(
                    merchant?.CreditCardPaymentLinkFeePercentage ?? platform.CreditCardPaymentLinkFeePercentage,
                    merchant?.CreditCardPaymentLinkInstallmentFeePercentage ?? platform.CreditCardPaymentLinkInstallmentFeePercentage,
                    installments),
                InstallmentFeePercentage: merchant?.CreditCardPaymentLinkInstallmentFeePercentage ?? platform.CreditCardPaymentLinkInstallmentFeePercentage,
                ReservePercentage: merchant?.CreditCardReservePercentage ?? platform.CreditCardReservePercentage,
                ReserveCompensationDays: merchant?.CreditCardReserveCompensationDays ?? platform.CreditCardReserveCompensationDays,
                MinTransactionAmount: merchant?.PixMinTransactionAmount ?? platform.PixMinTransactionAmount,
                MaxTransactionAmount: merchant?.PixMaxTransactionAmount ?? platform.PixMaxTransactionAmount),

            PaymentMethod.CreditCard => new MerchantPaymentFeeSettings(
                FeeMode: merchant?.CreditCardApiFeeMode ?? platform.CreditCardApiFeeMode,
                FeeFixed: merchant?.CreditCardApiFeeFixed ?? platform.CreditCardApiFeeFixed,
                FeePercentage: ResolveEffectiveCardFeePercentage(
                    merchant?.CreditCardApiFeePercentage ?? platform.CreditCardApiFeePercentage,
                    merchant?.CreditCardApiInstallmentFeePercentage ?? platform.CreditCardApiInstallmentFeePercentage,
                    installments),
                InstallmentFeePercentage: merchant?.CreditCardApiInstallmentFeePercentage ?? platform.CreditCardApiInstallmentFeePercentage,
                ReservePercentage: merchant?.CreditCardReservePercentage ?? platform.CreditCardReservePercentage,
                ReserveCompensationDays: merchant?.CreditCardReserveCompensationDays ?? platform.CreditCardReserveCompensationDays,
                MinTransactionAmount: merchant?.PixMinTransactionAmount ?? platform.PixMinTransactionAmount,
                MaxTransactionAmount: merchant?.PixMaxTransactionAmount ?? platform.PixMaxTransactionAmount),

            _ when feeContext == PaymentFeeContext.Checkout => new MerchantPaymentFeeSettings(
                FeeMode: merchant?.PixCheckoutFeeMode ?? platform.PixCheckoutFeeMode,
                FeeFixed: merchant?.PixCheckoutFeeFixed ?? platform.PixCheckoutFeeFixed,
                FeePercentage: merchant?.PixCheckoutFeePercentage ?? platform.PixCheckoutFeePercentage,
                InstallmentFeePercentage: 0,
                ReservePercentage: merchant?.PixReservePercentage ?? platform.PixReservePercentage,
                ReserveCompensationDays: merchant?.PixReserveCompensationDays ?? platform.PixReserveCompensationDays,
                MinTransactionAmount: merchant?.PixMinTransactionAmount ?? platform.PixMinTransactionAmount,
                MaxTransactionAmount: merchant?.PixMaxTransactionAmount ?? platform.PixMaxTransactionAmount),

            _ when feeContext == PaymentFeeContext.PaymentLink => new MerchantPaymentFeeSettings(
                FeeMode: merchant?.PixPaymentLinkFeeMode ?? platform.PixPaymentLinkFeeMode,
                FeeFixed: merchant?.PixPaymentLinkFeeFixed ?? platform.PixPaymentLinkFeeFixed,
                FeePercentage: merchant?.PixPaymentLinkFeePercentage ?? platform.PixPaymentLinkFeePercentage,
                InstallmentFeePercentage: 0,
                ReservePercentage: merchant?.PixReservePercentage ?? platform.PixReservePercentage,
                ReserveCompensationDays: merchant?.PixReserveCompensationDays ?? platform.PixReserveCompensationDays,
                MinTransactionAmount: merchant?.PixMinTransactionAmount ?? platform.PixMinTransactionAmount,
                MaxTransactionAmount: merchant?.PixMaxTransactionAmount ?? platform.PixMaxTransactionAmount),

            _ => new MerchantPaymentFeeSettings(
                FeeMode: merchant?.PixApiFeeMode ?? platform.PixApiFeeMode,
                FeeFixed: merchant?.PixApiFeeFixed ?? platform.PixApiFeeFixed,
                FeePercentage: merchant?.PixApiFeePercentage ?? platform.PixApiFeePercentage,
                InstallmentFeePercentage: 0,
                ReservePercentage: merchant?.PixReservePercentage ?? platform.PixReservePercentage,
                ReserveCompensationDays: merchant?.PixReserveCompensationDays ?? platform.PixReserveCompensationDays,
                MinTransactionAmount: merchant?.PixMinTransactionAmount ?? platform.PixMinTransactionAmount,
                MaxTransactionAmount: merchant?.PixMaxTransactionAmount ?? platform.PixMaxTransactionAmount)
        };
    }

    private static int ResolveEffectiveCardFeePercentage(int baseFeePercentage, int installmentFeePercentage, int installments)
    {
        if (installments <= 1 || installmentFeePercentage <= 0)
        {
            return baseFeePercentage;
        }

        var additionalInstallments = installments - 1;
        var effectiveFee = baseFeePercentage + (additionalInstallments * installmentFeePercentage);

        return Math.Min(10000, effectiveFee);
    }

    public long CalculateMerchantSettlementAmount(long netAmount, MerchantPaymentFeeSettings settings)
    {
        if (settings.ReserveCompensationDays <= 0)
        {
            return Math.Max(0, netAmount);
        }

        return calculationService.CalculateMerchantSettlementAmount(netAmount, settings.ReservePercentage);
    }

    public long CalculateMerchantReserveAmount(long netAmount, MerchantPaymentFeeSettings settings)
    {
        if (settings.ReserveCompensationDays <= 0)
        {
            return 0;
        }

        return calculationService.CalculateMerchantReserveAmount(netAmount, settings.ReservePercentage);
    }

    public async Task<MerchantCashoutPreview> PreviewCashoutAsync(
        Guid merchantId,
        long amount,
        Guid? merchantAcquirerId,
        bool consolidateAllAcquirers,
        CancellationToken ct = default)
    {
        var feeSettings = await GetWithdrawalFeeSettingsAsync(merchantId, ct);

        var availableBalance = await ledgerService.GetMerchantAvailableBalanceAsync(merchantId);
        var withdrawNowAvailable = await ledgerService.GetMerchantWithdrawNowAvailableBalanceAsync(merchantId);
        var selectedBucketAvailable = merchantAcquirerId.HasValue
            ? await ledgerService.GetMerchantAvailableBalanceAsync(merchantId, merchantAcquirerId.Value)
            : withdrawNowAvailable;

        if (consolidateAllAcquirers)
        {
            var bucketBalances = await ledgerService.GetMerchantAcquirerBucketBalancesAsync(merchantId);
            var operationCount = bucketBalances.Count > 0 ? bucketBalances.Count : 1;
            var fee = bucketBalances.Sum(b =>
                FeeCalculator.Calculate(b.Balance, feeSettings.FeeMode, feeSettings.FeeFixed, feeSettings.FeePercentage));

            return new MerchantCashoutPreview(
                EffectiveAmount: availableBalance,
                Fee: fee,
                NetAmount: availableBalance - fee,
                MaxWithdrawableAmount: availableBalance,
                WithdrawNowAvailable: selectedBucketAvailable,
                HasSufficientBalance: availableBalance > 0,
                IsConsolidated: true,
                OperationCount: operationCount);
        }

        var singleFee = FeeCalculator.Calculate(amount, feeSettings.FeeMode, feeSettings.FeeFixed, feeSettings.FeePercentage);

        return new MerchantCashoutPreview(
            EffectiveAmount: amount,
            Fee: singleFee,
            NetAmount: amount - singleFee,
            MaxWithdrawableAmount: selectedBucketAvailable,
            WithdrawNowAvailable: selectedBucketAvailable,
            HasSufficientBalance: amount <= selectedBucketAvailable,
            IsConsolidated: false,
            OperationCount: 1);
    }

    private async Task<(PlatformSettings Platform, MerchantSettings? Merchant)> GetSettingsAsync(
        Guid merchantId,
        CancellationToken ct)
    {
        var platform = await dbContext.PlatformSettings
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(ct) ?? new PlatformSettings();

        var merchant = await dbContext.MerchantSettings
            .AsNoTracking()
            .Where(ms => ms.MerchantId == merchantId)
            .OrderBy(ms => ms.Id)
            .FirstOrDefaultAsync(ct);

        return (platform, merchant);
    }
}
