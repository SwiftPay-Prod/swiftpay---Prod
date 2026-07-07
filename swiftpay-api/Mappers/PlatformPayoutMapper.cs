using swiftpay_api.Endpoints.Admin.PlatformPayouts.CreatePlatformPayout;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Mappers;

public static class PlatformPayoutMapper
{
    public static AdminPlatformPayoutData ToData(PlatformPayout payout, string? requestedByUserName = null)
    {
        return new AdminPlatformPayoutData
        {
            Id = payout.Id,
            PlatformPayoutAccountId = payout.PlatformPayoutAccountId,
            Environment = payout.Environment.ToString(),
            TotalAmount = payout.TotalAmount,
            TotalFee = payout.TotalFee,
            TotalNetAmount = payout.TotalNetAmount,
            Status = payout.Status.ToString(),
            Notes = payout.Notes,
            RequestedByUserId = payout.RequestedByUserId,
            RequestedByUserName = requestedByUserName ?? payout.RequestedByUser?.Name,
            RequestedAt = payout.RequestedAt,
            CompletedAt = payout.CompletedAt,
            PayoutAccount = payout.PayoutAccount != null
                ? new AdminPlatformPayoutAccountInfo
                {
                    Id = payout.PayoutAccount.Id,
                    PixKeyType = payout.PayoutAccount.PixKeyType.ToString(),
                    PixKey = payout.PayoutAccount.PixKey,
                    HolderName = payout.PayoutAccount.HolderName ?? string.Empty,
                    BankName = payout.PayoutAccount.BankName
                }
                : null,
            Items = payout.Items?.Select(ToItemData).ToList() ?? [],
            CreatedAt = payout.CreatedAt
        };
    }

    public static AdminPlatformPayoutItemData ToItemData(PlatformPayoutItem item)
    {
        return new AdminPlatformPayoutItemData
        {
            Id = item.Id,
            AcquirerId = item.AcquirerId,
            AcquirerName = item.Acquirer?.DisplayName ?? item.Acquirer?.Name ?? string.Empty,
            AcquirerCode = item.Acquirer?.Code ?? string.Empty,
            AcquirerLogoUrl = item.Acquirer?.LogoUrl,
            Amount = item.Amount,
            AcquirerFee = item.AcquirerFee,
            NetAmount = item.NetAmount,
            Status = item.Status.ToString(),
            AcquirerTransactionId = item.AcquirerTransactionId,
            PixEndToEndId = item.PixEndToEndId,
            FailureReason = item.FailureReason,
            ProcessedAt = item.ProcessedAt,
            CompletedAt = item.CompletedAt
        };
    }
}
