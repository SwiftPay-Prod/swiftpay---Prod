using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Models.PaymentApi;

public sealed class ReprocessCompletedPlatformPayoutItemDevApiInput
{
    public Guid PlatformPayoutItemId { get; set; }
    public ReprocessPlatformPayoutTargetStatus TargetStatus { get; set; } = ReprocessPlatformPayoutTargetStatus.Completed;
}

public enum ReprocessPlatformPayoutTargetStatus
{
    Completed,
    Failed
}

public sealed class ReprocessCompletedPlatformPayoutItemDevApiResult
{
    public bool Success { get; set; }
    public Guid? PlatformPayoutItemId { get; set; }
    public Guid? PlatformPayoutId { get; set; }
    public PlatformPayoutStatus? Status { get; set; }
    public int ProcessedItemsCount { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
}
