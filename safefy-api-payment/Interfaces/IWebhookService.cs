using safefy_api_core.Models.Database;

namespace safefy_api_payment.Interfaces;

public interface IWebhookService
{
    Task SendWebhookAsync(Guid paymentId, string eventType);
}
