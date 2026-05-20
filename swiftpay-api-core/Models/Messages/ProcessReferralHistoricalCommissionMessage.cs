namespace safefy_api_core.Models.Messages;

using safefy_api_core.Models.Enum;

public class ProcessReferralHistoricalCommissionMessage
{
    public Guid ReferredUserId { get; set; }
    public Guid ReferrerUserId { get; set; }
    public DateTime ReferredAt { get; set; }
    public ApiEnvironment Environment { get; set; }
}
