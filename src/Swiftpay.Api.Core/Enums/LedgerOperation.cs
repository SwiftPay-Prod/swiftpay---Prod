namespace Swiftpay.Domain.Enums;

public enum LedgerOperation
{
    PixIn,
    PixOut,
    PixRefund,
    PixPartialRefund,
    PlatformFee,
    SettlementIn,
    SettlementOut,
    PayOut,
    PlatformPayOutRequested,
    PlatformPayOut,
    Reversal,
    PlatformAdjustment,
    AcquirerAdjustment,
    MerchantAdjustment
}
