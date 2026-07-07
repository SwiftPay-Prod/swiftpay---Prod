using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Models.Messages;

public sealed record ProcessPlatformPayoutItemMessage
{
    public Guid PlatformPayoutId { get; init; }
    public Guid PlatformPayoutItemId { get; init; }
    public Guid AcquirerId { get; init; }
    public ApiEnvironment Environment { get; init; } = ApiEnvironment.Production;
}
