using safefy_api_core.Models.Enum;

namespace safefy_api_core.Models.Messages;

public sealed record RecordLedgerPendingMessage
{
    public Guid MerchantId { get; init; }
    public Guid MerchantAcquirerId { get; init; }
    public Guid PaymentId { get; init; }
    public long Amount { get; init; }
    public long PlatformFee { get; init; }
    public long MerchantSettlementAmount { get; init; }
    public string? Description { get; init; }
    public ApiEnvironment Environment { get; init; }
}
