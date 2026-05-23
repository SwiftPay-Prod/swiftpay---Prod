namespace Swiftpay.Domain.Entities;

public class WebhookConfiguration
{
    public Guid Id { get; set; }
    public Guid MerchantId { get; set; }
    public string Url { get; set; } = string.Empty;
    public string Secret { get; set; } = string.Empty;
    public string Events { get; set; } = "payment.completed,payment.failed";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
