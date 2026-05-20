using safefy_api_core.Models.Enum;

namespace safefy_api_core.Models.Messages;

public sealed record ProcessCashoutMessage
{
    public Guid PayoutId { get; init; }
    public Guid MerchantId { get; init; }
    public Guid? PayoutAccountId { get; init; }
    public Guid MerchantAcquirerId { get; init; }
    public ApiEnvironment Environment { get; init; } = ApiEnvironment.Production;
    public string? InlinePixKey { get; init; }
    public string? InlinePixKeyType { get; init; }
}
