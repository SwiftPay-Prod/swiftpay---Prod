using swiftpay_api_core.Models.Database;

namespace swiftpay_api_payment.Interfaces;

public interface IWebhookService
{
    Task SendWebhookAsync(Guid paymentId, string eventType);
}
