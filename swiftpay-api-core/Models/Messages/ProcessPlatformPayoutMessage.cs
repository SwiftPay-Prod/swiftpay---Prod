using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Models.Messages;

public sealed record ProcessPlatformPayoutMessage
{
    public Guid PlatformPayoutId { get; init; }
    public ApiEnvironment Environment { get; init; } = ApiEnvironment.Production;
}
