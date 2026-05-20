namespace safefy_api_core.Models.Messages;

public sealed record SendWebhookMessage
{
    public Guid PaymentId { get; init; }
    public string EventType { get; init; } = string.Empty;
}
