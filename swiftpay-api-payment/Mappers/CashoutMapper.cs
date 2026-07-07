using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Utils;
using swiftpay_api_payment.Endpoints.Cashouts.Create;
using swiftpay_api_payment.Endpoints.Cashouts.Get;
using swiftpay_api_payment.Endpoints.Cashouts.List;

namespace swiftpay_api_payment.Mappers;

public static class CashoutMapper
{
    public static CashoutData ToData(Payout payout, MerchantPayoutAccount? payoutAccount)
    {
        return new CashoutData
        {
            Id = payout.Id,
            ExternalId = payout.ExternalId,
            Amount = payout.Amount,
            Fee = payout.PlatformFee,
            NetAmount = payout.NetAmount,
            Currency = "BRL",
            Status = payout.Status,
            Environment = payout.Environment,
            Pix = new CashoutPixData
            {
                PixKeyType = payoutAccount?.PixKeyType.ToString(),
                PixKey = payoutAccount != null 
                    ? MaskUtils.MaskPixKey(payoutAccount.PixKey, payoutAccount.PixKeyType.ToString()) 
                    : null,
                EndToEndId = payout.PixEndToEndId
            },
            RequestedAt = payout.RequestedAt,
            ProcessedAt = payout.ProcessedAt,
            CompletedAt = payout.CompletedAt,
            FailureReason = payout.FailureReason,
            CreatedAt = payout.CreatedAt
        };
    }

    public static GetCashoutData ToGetData(Payout payout, MerchantPayoutAccount? payoutAccount)
    {
        return new GetCashoutData
        {
            Id = payout.Id,
            ExternalId = payout.ExternalId,
            Amount = payout.Amount,
            Fee = payout.PlatformFee,
            NetAmount = payout.NetAmount,
            Currency = "BRL",
            Status = payout.Status,
            Environment = payout.Environment,
            Pix = new GetCashoutPixData
            {
                PixKeyType = payoutAccount?.PixKeyType.ToString(),
                PixKey = payoutAccount != null 
                    ? MaskUtils.MaskPixKey(payoutAccount.PixKey, payoutAccount.PixKeyType.ToString()) 
                    : null,
                EndToEndId = payout.PixEndToEndId
            },
            RequestedAt = payout.RequestedAt,
            ProcessedAt = payout.ProcessedAt,
            CompletedAt = payout.CompletedAt,
            FailureReason = payout.FailureReason,
            CreatedAt = payout.CreatedAt
        };
    }

    public static CashoutListItemData ToListItemData(Payout payout, MerchantPayoutAccount? payoutAccount)
    {
        return new CashoutListItemData
        {
            Id = payout.Id,
            Amount = payout.Amount,
            Fee = payout.PlatformFee,
            NetAmount = payout.NetAmount,
            Status = payout.Status,
            PixKeyType = payoutAccount?.PixKeyType.ToString(),
            PixKey = payoutAccount != null 
                ? MaskUtils.MaskPixKey(payoutAccount.PixKey, payoutAccount.PixKeyType.ToString()) 
                : null,
            EndToEndId = payout.PixEndToEndId,
            FailureReason = payout.FailureReason,
            RequestedAt = payout.RequestedAt,
            CompletedAt = payout.CompletedAt,
            CreatedAt = payout.CreatedAt
        };
    }
}
