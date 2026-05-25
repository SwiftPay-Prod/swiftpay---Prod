namespace Swiftpay.Domain.Entities;

public class WebhookDeliveryLog
{
    public Guid Id { get; set; }
    public Guid WebhookConfigurationId { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending";
    public string? RequestBody { get; set; }
    public int? ResponseStatus { get; set; }
    public string? ResponseBody { get; set; }
    public int Attempts { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}
