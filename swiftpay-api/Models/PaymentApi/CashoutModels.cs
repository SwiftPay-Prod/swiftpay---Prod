using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Models.PaymentApi;

public sealed class CreateCashoutApiInput
{
    public Guid MerchantId { get; set; }
    public Guid UserId { get; set; }
    public long Amount { get; set; }
    public Guid? PayoutAccountId { get; set; }
    public Guid? MerchantAcquirerId { get; set; }
    public string IpAddress { get; set; } = string.Empty;
    public string? Location { get; set; }
    public ApiEnvironment Environment { get; set; } = ApiEnvironment.Production;
    public bool ConsolidateAllAcquirers { get; set; }
}

public sealed class CreateCashoutApiResult
{
    public bool Success { get; set; }
    public Guid? CashoutId { get; set; }
    public PayoutStatus? Status { get; set; }
    public long? Amount { get; set; }
    public long? PlatformFee { get; set; }
    public long? NetAmount { get; set; }
    public string? PixKey { get; set; }
    public string? PixKeyType { get; set; }
    public bool RequiresApproval { get; set; }
    public List<CreateCashoutApiPayoutItem>? Payouts { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
}

public sealed class CreateCashoutApiPayoutItem
{
    public Guid Id { get; set; }
    public PayoutStatus Status { get; set; }
    public long Amount { get; set; }
    public long PlatformFee { get; set; }
    public long NetAmount { get; set; }
}

public sealed class EvaluateCashoutApiInput
{
    public Guid CashoutId { get; set; }
    public Guid EvaluatedById { get; set; }
    public EvaluateCashoutAction Action { get; set; }
    public string? Reason { get; set; }
}

public enum EvaluateCashoutAction
{
    Approve,
    Reject
}

public sealed class EvaluateCashoutApiResult
{
    public bool Success { get; set; }
    public Guid? CashoutId { get; set; }
    public PayoutStatus? Status { get; set; }
    public string? AcquirerTransactionId { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
}

public sealed class CancelCashoutApiInput
{
    public Guid CashoutId { get; set; }
    public Guid MerchantId { get; set; }
    public Guid UserId { get; set; }
}

public sealed class CancelCashoutApiResult
{
    public bool Success { get; set; }
    public Guid? CashoutId { get; set; }
    public PayoutStatus? Status { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
}

public sealed class SimulateCashoutApiInput
{
    public Guid CashoutId { get; set; }
    public Guid MerchantId { get; set; }
    public string Action { get; set; } = string.Empty;
}

public sealed class SimulateCashoutApiResult
{
    public bool Success { get; set; }
    public Guid? CashoutId { get; set; }
    public PayoutStatus? Status { get; set; }
    public string? SimulatedAction { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? FailureReason { get; set; }
    public string? EndToEndId { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
    public int StatusCode { get; set; } = 200;
}

public sealed class ReprocessCompletedCashoutDevApiInput
{
    public Guid CashoutId { get; set; }
    public Guid MerchantId { get; set; }
    public ReprocessCashoutTargetStatus TargetStatus { get; set; } = ReprocessCashoutTargetStatus.Completed;
}

public enum ReprocessCashoutTargetStatus
{
    Completed,
    Failed,
    Rejected
}

public sealed class ReprocessCompletedCashoutDevApiResult
{
    public bool Success { get; set; }
    public Guid? CashoutId { get; set; }
    public PayoutStatus? Status { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? EndToEndId { get; set; }
    public string? AcquirerTransactionId { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
}
