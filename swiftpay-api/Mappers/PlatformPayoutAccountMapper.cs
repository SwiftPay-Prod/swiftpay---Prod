using swiftpay_api.Endpoints.Admin.PlatformPayoutAccounts.CreatePlatformPayoutAccount;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Mappers;

public static class PlatformPayoutAccountMapper
{
    public static AdminPlatformPayoutAccountData ToData(PlatformPayoutAccount account, string? createdByUserName = null)
    {
        return new AdminPlatformPayoutAccountData
        {
            Id = account.Id,
            PixKeyType = account.PixKeyType.ToString(),
            PixKey = account.PixKey,
            HolderName = account.HolderName,
            HolderDocument = account.HolderDocument,
            BankName = account.BankName,
            BankIspb = account.BankIspb,
            IsActive = account.IsActive,
            DeactivatedAt = account.DeactivatedAt,
            CreatedByUserId = account.CreatedByUserId,
            CreatedByUserName = createdByUserName ?? account.CreatedByUser?.Name,
            CreatedAt = account.CreatedAt,
            UpdatedAt = account.UpdatedAt
        };
    }
}
