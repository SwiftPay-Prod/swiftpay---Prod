using safefy_api_core.Models.Database;

namespace safefy_api_core.Utils;

public readonly record struct NominalFeeRule(FeeChargeMode Mode, long Fixed, int Percentage);

public static class NominalFeeCompatibilityUtils
{
    public static bool IsAcquirerFeeCompatible(
        Acquirer acquirer,
        MerchantAcquirer? linkedMerchantAcquirer,
        MerchantSettings? merchantSettings,
        PlatformSettings platformSettings)
    {
        var merchantPixApiFee = new NominalFeeRule(
            merchantSettings?.PixApiFeeMode ?? platformSettings.PixApiFeeMode,
            merchantSettings?.PixApiFeeFixed ?? platformSettings.PixApiFeeFixed,
            merchantSettings?.PixApiFeePercentage ?? platformSettings.PixApiFeePercentage);

        var merchantPixCheckoutFee = new NominalFeeRule(
            merchantSettings?.PixCheckoutFeeMode ?? platformSettings.PixCheckoutFeeMode,
            merchantSettings?.PixCheckoutFeeFixed ?? platformSettings.PixCheckoutFeeFixed,
            merchantSettings?.PixCheckoutFeePercentage ?? platformSettings.PixCheckoutFeePercentage);

        var merchantPixPaymentLinkFee = new NominalFeeRule(
            merchantSettings?.PixPaymentLinkFeeMode ?? platformSettings.PixPaymentLinkFeeMode,
            merchantSettings?.PixPaymentLinkFeeFixed ?? platformSettings.PixPaymentLinkFeeFixed,
            merchantSettings?.PixPaymentLinkFeePercentage ?? platformSettings.PixPaymentLinkFeePercentage);

        var merchantBoletoApiFee = new NominalFeeRule(
            merchantSettings?.BoletoApiFeeMode ?? platformSettings.BoletoApiFeeMode,
            merchantSettings?.BoletoApiFeeFixed ?? platformSettings.BoletoApiFeeFixed,
            merchantSettings?.BoletoApiFeePercentage ?? platformSettings.BoletoApiFeePercentage);

        var merchantBoletoCheckoutFee = new NominalFeeRule(
            merchantSettings?.BoletoCheckoutFeeMode ?? platformSettings.BoletoCheckoutFeeMode,
            merchantSettings?.BoletoCheckoutFeeFixed ?? platformSettings.BoletoCheckoutFeeFixed,
            merchantSettings?.BoletoCheckoutFeePercentage ?? platformSettings.BoletoCheckoutFeePercentage);

        var merchantBoletoPaymentLinkFee = new NominalFeeRule(
            merchantSettings?.BoletoPaymentLinkFeeMode ?? platformSettings.BoletoPaymentLinkFeeMode,
            merchantSettings?.BoletoPaymentLinkFeeFixed ?? platformSettings.BoletoPaymentLinkFeeFixed,
            merchantSettings?.BoletoPaymentLinkFeePercentage ?? platformSettings.BoletoPaymentLinkFeePercentage);

        var merchantCreditCardApiFee = new NominalFeeRule(
            merchantSettings?.CreditCardApiFeeMode ?? platformSettings.CreditCardApiFeeMode,
            merchantSettings?.CreditCardApiFeeFixed ?? platformSettings.CreditCardApiFeeFixed,
            merchantSettings?.CreditCardApiFeePercentage ?? platformSettings.CreditCardApiFeePercentage);

        var merchantCreditCardCheckoutFee = new NominalFeeRule(
            merchantSettings?.CreditCardCheckoutFeeMode ?? platformSettings.CreditCardCheckoutFeeMode,
            merchantSettings?.CreditCardCheckoutFeeFixed ?? platformSettings.CreditCardCheckoutFeeFixed,
            merchantSettings?.CreditCardCheckoutFeePercentage ?? platformSettings.CreditCardCheckoutFeePercentage);

        var merchantCreditCardPaymentLinkFee = new NominalFeeRule(
            merchantSettings?.CreditCardPaymentLinkFeeMode ?? platformSettings.CreditCardPaymentLinkFeeMode,
            merchantSettings?.CreditCardPaymentLinkFeeFixed ?? platformSettings.CreditCardPaymentLinkFeeFixed,
            merchantSettings?.CreditCardPaymentLinkFeePercentage ?? platformSettings.CreditCardPaymentLinkFeePercentage);

        var merchantWithdrawalFee = new NominalFeeRule(
            merchantSettings?.WithdrawalFeeMode ?? platformSettings.WithdrawalFeeMode,
            merchantSettings?.WithdrawalFeeFixed ?? platformSettings.WithdrawalFeeFixed,
            merchantSettings?.WithdrawalFeePercentage ?? platformSettings.WithdrawalFeePercentage);

        var isPixEnabledForMerchant = merchantSettings?.PixEnabled ?? platformSettings.PixEnabled;
        var isBoletoEnabledForMerchant = merchantSettings?.BoletoEnabled ?? platformSettings.BoletoEnabled;
        var isCreditCardEnabledForMerchant = merchantSettings?.CreditCardEnabled ?? platformSettings.CreditCardEnabled;
        var isWithdrawalEnabledForMerchant = merchantSettings?.WithdrawalEnabled ?? platformSettings.WithdrawalEnabled;

        var pixValidationAmount = merchantSettings?.PixMinTransactionAmount ?? platformSettings.PixMinTransactionAmount;
        var boletoValidationAmount = merchantSettings?.BoletoMinTransactionAmount ?? platformSettings.BoletoMinTransactionAmount;
        const long creditCardValidationAmount = 1L;
        var withdrawalValidationAmount = merchantSettings?.MinWithdrawalAmount ?? platformSettings.MinWithdrawalAmount;

        return IsAcquirerFeeCompatibleByRules(
            acquirer,
            linkedMerchantAcquirer,
            merchantPixApiFee,
            merchantPixCheckoutFee,
            merchantPixPaymentLinkFee,
            merchantBoletoApiFee,
            merchantBoletoCheckoutFee,
            merchantBoletoPaymentLinkFee,
            merchantCreditCardApiFee,
            merchantCreditCardCheckoutFee,
            merchantCreditCardPaymentLinkFee,
            isPixEnabledForMerchant,
            isBoletoEnabledForMerchant,
            isCreditCardEnabledForMerchant,
            isWithdrawalEnabledForMerchant,
            pixValidationAmount,
            boletoValidationAmount,
            creditCardValidationAmount,
            withdrawalValidationAmount,
            merchantWithdrawalFee);
    }

    private static bool IsAcquirerFeeCompatibleByRules(
        Acquirer acquirer,
        MerchantAcquirer? linkedMerchantAcquirer,
        NominalFeeRule merchantPixApiFee,
        NominalFeeRule merchantPixCheckoutFee,
        NominalFeeRule merchantPixPaymentLinkFee,
        NominalFeeRule merchantBoletoApiFee,
        NominalFeeRule merchantBoletoCheckoutFee,
        NominalFeeRule merchantBoletoPaymentLinkFee,
        NominalFeeRule merchantCreditCardApiFee,
        NominalFeeRule merchantCreditCardCheckoutFee,
        NominalFeeRule merchantCreditCardPaymentLinkFee,
        bool isPixEnabledForMerchant,
        bool isBoletoEnabledForMerchant,
        bool isCreditCardEnabledForMerchant,
        bool isWithdrawalEnabledForMerchant,
        long pixValidationAmount,
        long boletoValidationAmount,
        long creditCardValidationAmount,
        long withdrawalValidationAmount,
        NominalFeeRule merchantWithdrawalFee)
    {
        var pixEnabledOnAcquirer = linkedMerchantAcquirer?.IsPixEnabled()
            ?? (acquirer.SupportsPix && acquirer.PixEnabled);

        var shouldValidatePixFee = isPixEnabledForMerchant && pixEnabledOnAcquirer;

        if (shouldValidatePixFee)
        {
            var acquirerPixFee = linkedMerchantAcquirer == null
                ? new NominalFeeRule(acquirer.PixInFeeMode, acquirer.PixInFeeFixed, acquirer.PixInFeePercentage)
                : new NominalFeeRule(linkedMerchantAcquirer.PixInFeeMode, linkedMerchantAcquirer.PixInFeeFixed, linkedMerchantAcquirer.PixInFeePercentage);

            var pixAmount = Math.Max(1, Math.Max(pixValidationAmount, acquirer.MinPixAmount));

            var isPixCompatible = IsFeeCompatibleAtAmount(merchantPixApiFee, acquirerPixFee, pixAmount)
                && IsFeeCompatibleAtAmount(merchantPixCheckoutFee, acquirerPixFee, pixAmount)
                && IsFeeCompatibleAtAmount(merchantPixPaymentLinkFee, acquirerPixFee, pixAmount);

            if (!isPixCompatible)
            {
                return false;
            }
        }

        var boletoEnabledOnAcquirer = linkedMerchantAcquirer?.IsBoletoEnabled()
            ?? (acquirer.SupportsBoleto && acquirer.BoletoEnabled);

        var shouldValidateBoletoFee = isBoletoEnabledForMerchant && boletoEnabledOnAcquirer;

        if (shouldValidateBoletoFee)
        {
            var acquirerBoletoFee = linkedMerchantAcquirer == null
                ? new NominalFeeRule(acquirer.BoletoInFeeMode, acquirer.BoletoInFeeFixed, acquirer.BoletoInFeePercentage)
                : new NominalFeeRule(linkedMerchantAcquirer.BoletoInFeeMode, linkedMerchantAcquirer.BoletoInFeeFixed, linkedMerchantAcquirer.BoletoInFeePercentage);

            var boletoAmount = Math.Max(1, Math.Max(boletoValidationAmount, acquirer.MinBoletoAmount));

            var isBoletoCompatible = IsFeeCompatibleAtAmount(merchantBoletoApiFee, acquirerBoletoFee, boletoAmount)
                && IsFeeCompatibleAtAmount(merchantBoletoCheckoutFee, acquirerBoletoFee, boletoAmount)
                && IsFeeCompatibleAtAmount(merchantBoletoPaymentLinkFee, acquirerBoletoFee, boletoAmount);

            if (!isBoletoCompatible)
            {
                return false;
            }
        }

        var creditCardEnabledOnAcquirer = linkedMerchantAcquirer?.IsCreditCardEnabled()
            ?? (acquirer.SupportsCreditCard && acquirer.CreditCardEnabled);

        var shouldValidateCreditCardFee = isCreditCardEnabledForMerchant && creditCardEnabledOnAcquirer;

        if (shouldValidateCreditCardFee)
        {
            var acquirerCreditCardFee = linkedMerchantAcquirer == null
                ? new NominalFeeRule(acquirer.CreditCardInFeeMode, acquirer.CreditCardInFeeFixed, acquirer.CreditCardInFeePercentage)
                : new NominalFeeRule(linkedMerchantAcquirer.CreditCardInFeeMode, linkedMerchantAcquirer.CreditCardInFeeFixed, linkedMerchantAcquirer.CreditCardInFeePercentage);

            var creditCardAmount = Math.Max(1, Math.Max(creditCardValidationAmount, acquirer.MinCreditCardAmount));

            var isCreditCardCompatible = IsFeeCompatibleAtAmount(merchantCreditCardApiFee, acquirerCreditCardFee, creditCardAmount)
                && IsFeeCompatibleAtAmount(merchantCreditCardCheckoutFee, acquirerCreditCardFee, creditCardAmount)
                && IsFeeCompatibleAtAmount(merchantCreditCardPaymentLinkFee, acquirerCreditCardFee, creditCardAmount);

            if (!isCreditCardCompatible)
            {
                return false;
            }
        }

        if (isWithdrawalEnabledForMerchant && acquirer.SupportsWithdrawal)
        {
            var acquirerPayoutFee = linkedMerchantAcquirer == null
                ? new NominalFeeRule(acquirer.PayoutFeeMode, acquirer.PayoutFeeFixed, acquirer.PayoutFeePercentage)
                : new NominalFeeRule(linkedMerchantAcquirer.PayoutFeeMode, linkedMerchantAcquirer.PayoutFeeFixed, linkedMerchantAcquirer.PayoutFeePercentage);

            var payoutAmount = Math.Max(1, Math.Max(withdrawalValidationAmount, acquirer.MinPayoutAmount));

            if (!IsFeeCompatibleAtAmount(merchantWithdrawalFee, acquirerPayoutFee, payoutAmount))
            {
                return false;
            }
        }

        return true;
    }

    public static bool IsFeeCompatibleAtAmount(NominalFeeRule merchantFee, NominalFeeRule acquirerFee, long amount)
    {
        var validationAmount = Math.Max(1, amount);

        var merchantCalculatedFee = FeeCalculator.Calculate(
            validationAmount,
            merchantFee.Mode,
            merchantFee.Fixed,
            merchantFee.Percentage);

        var acquirerCalculatedFee = FeeCalculator.Calculate(
            validationAmount,
            acquirerFee.Mode,
            acquirerFee.Fixed,
            acquirerFee.Percentage);

        return acquirerCalculatedFee <= merchantCalculatedFee;
    }
}