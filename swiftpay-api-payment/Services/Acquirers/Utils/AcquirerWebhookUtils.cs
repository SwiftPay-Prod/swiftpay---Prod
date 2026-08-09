using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Utils;

namespace swiftpay_api_payment.Services.Acquirers.Utils;

public static class AcquirerWebhookUtils
{
    public static string? ResolveWebhookPath(AcquirerType acquirerType)
    {
        return acquirerType switch
        {
            AcquirerType.ActivePayments => "/v1/internal/activepayments/webhooks",
            AcquirerType.IHubBanking => "/v1/internal/ihubbanking/webhooks",
            AcquirerType.Bankizi => "/v1/internal/bankizi/webhooks",
            AcquirerType.Rapdyn => "/v1/internal/rapdyn/webhooks",
            AcquirerType.Coldfy => "/v1/internal/coldfy/webhooks",
            AcquirerType.Pluggou => "/v1/internal/pluggou/webhooks",
            AcquirerType.HunterPay => "/v1/internal/hunterpay/webhooks",
            AcquirerType.HeartPay => "/v1/internal/heartpay/webhooks",
            AcquirerType.Accithus => "/v1/internal/accithus/webhooks",
            AcquirerType.MagicPay => "/v1/internal/magicpay/webhooks",
            AcquirerType.FlevoPay => "/v1/internal/flevopay/webhooks/transactions",
            AcquirerType.AkkadPag => "/v1/internal/akkadpag/webhooks/transactions",
            _ => null
        };
    }

    public static string? BuildWebhookUrl(string? platformBaseUrl, AcquirerType acquirerType)
    {
        var path = ResolveWebhookPath(acquirerType);
        if (string.IsNullOrEmpty(path) || string.IsNullOrEmpty(platformBaseUrl))
        {
            return null;
        }

        return WebhookUtils.BuildWebhookUrl(platformBaseUrl, path);
    }
}
