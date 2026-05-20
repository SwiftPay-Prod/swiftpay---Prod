namespace safefy_api_payment.Interfaces;

public interface ICashoutWebhookService
{
    Task SendWebhookAsync(Guid payoutId, string eventType);
}
