using swiftpay_api.Endpoints.Admin.Balance.ReadAcquirerMerchantAvailability;

namespace swiftpay_api.Mappers;

public static class AdminPlatformBalanceMerchantAvailabilityMapper
{
    public static AdminPlatformBalanceMerchantAvailabilityData ToData(AdminPlatformBalanceMerchantAvailabilityProjection projection) => new()
    {
        MerchantId = projection.MerchantId,
        MerchantName = projection.MerchantName,
        Email = projection.Email,
        DocumentNumber = projection.DocumentNumber,
        DocumentType = projection.DocumentType,
        AvailableBalance = projection.AvailableBalance,
        BlockedBalance = projection.BlockedBalance,
        ReservedBalance = projection.ReservedBalance
    };
}