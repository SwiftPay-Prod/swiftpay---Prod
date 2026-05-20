namespace safefy_api_core.Models.Messages;

public sealed record SendCashoutWebhookMessage
{
    public Guid PayoutId { get; init; }
    public string EventType { get; init; } = string.Empty;
}
