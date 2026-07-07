namespace swiftpay_api_core.Models.Calculation;

public sealed record MerchantCashoutPreview(
    long EffectiveAmount,
    long Fee,
    long NetAmount,
    long MaxWithdrawableAmount,
    long WithdrawNowAvailable,
    bool HasSufficientBalance,
    bool IsConsolidated,
    int OperationCount);
