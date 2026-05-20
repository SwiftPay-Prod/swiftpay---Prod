using safefy_api_core.Models.Enum;

namespace safefy_api_core.Models.Messages;

public sealed class ProcessPlatformBalanceMessage
{
    public required Guid AcquirerId { get; init; }

    public required ApiEnvironment Environment { get; init; }
}
