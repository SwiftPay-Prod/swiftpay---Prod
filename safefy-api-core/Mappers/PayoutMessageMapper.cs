using safefy_api_core.Models.Database;
using safefy_api_core.Models.Messages;

namespace safefy_api_core.Mappers;

public static class PayoutMessageMapper
{
    public static ProcessCashoutMessage ToProcessMessage(this Payout payout)
    {
        return new ProcessCashoutMessage
        {
            PayoutId = payout.Id,
            MerchantId = payout.MerchantId,
            PayoutAccountId = payout.MerchantPayoutAccountId,
            MerchantAcquirerId = payout.MerchantAcquirerId,
            Environment = payout.Environment,
            InlinePixKey = payout.InlinePixKey,
            InlinePixKeyType = payout.InlinePixKeyType
        };
    }

    public static SendCashoutWebhookMessage ToWebhookMessage(this Payout payout, string eventType)
    {
        return new SendCashoutWebhookMessage
        {
            PayoutId = payout.Id,
            EventType = eventType
        };
    }
}
