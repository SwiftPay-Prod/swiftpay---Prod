namespace Swiftpay.Domain.Enums;

public enum AccountType
{
    MerchantAvailable,
    MerchantPending,
    MerchantBlocked,
    MerchantReserved,
    MerchantPayoutsOut,
    PlatformBlocked,
    PlatformPayoutsOut,
    AcquirerSettlement,
    AcquirerPayoutsOut
}
