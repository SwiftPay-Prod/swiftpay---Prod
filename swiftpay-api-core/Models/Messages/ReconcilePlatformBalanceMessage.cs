using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Models.Messages;

public sealed class ReconcilePlatformBalanceMessage
{
    public required Guid RequestedByUserId { get; init; }

    public required bool ApplyFix { get; init; }

    public required ApiEnvironment Environment { get; init; }
}
