using swiftpay_api_core.Models.Database;

namespace swiftpay_api_core.Models.Calculation;

public enum PaymentFeeContext
{
    Api,
    Checkout,
    PaymentLink
}

public sealed record MerchantPaymentFeeSettings(
    FeeChargeMode FeeMode,
    long FeeFixed,
    int FeePercentage,
    int InstallmentFeePercentage,
    int ReservePercentage,
    int ReserveCompensationDays,
    long MinTransactionAmount,
    long MaxTransactionAmount);
