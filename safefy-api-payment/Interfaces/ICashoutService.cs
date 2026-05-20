using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_payment.Services.Sandbox;

namespace safefy_api_payment.Interfaces;

public interface ICashoutService
{
    Task<CreateCashoutResult> CreateAsync(CreateCashoutInput input, CancellationToken ct = default);
    Task<GetCashoutResult> GetByIdAsync(Guid merchantId, Guid cashoutId, ApiEnvironment environment, CancellationToken ct = default);
    Task<ListCashoutResult> ListAsync(ListCashoutInput input, CancellationToken ct = default);
    Task<CancelCashoutResult> CancelAsync(Guid merchantId, Guid cashoutId, ApiEnvironment environment, CancellationToken ct = default);
    
    /// <summary>
    /// Simula um cashout (apenas ambiente Sandbox).
    /// </summary>
    Task<SimulateCashoutResult> SimulateAsync(Guid merchantId, Guid cashoutId, ApiEnvironment environment, SimulateCashoutAction action, CancellationToken ct = default);
    
    Task<CreateCashoutResult> CreateInternalAsync(CreateCashoutInternalInput input, CancellationToken ct = default);
    Task<CancelCashoutResult> CancelInternalAsync(Guid merchantId, Guid cashoutId, Guid userId, CancellationToken ct = default);
    Task<ApproveCashoutResult> ApproveAsync(Guid cashoutId, Guid evaluatedById, CancellationToken ct = default);
    Task<RejectCashoutResult> RejectAsync(Guid cashoutId, Guid evaluatedById, string reason, CancellationToken ct = default);
    
    Task<ProcessCashoutWebhookResult> ProcessAcquirerWebhookAsync(AcquirerCashoutWebhookData data, CancellationToken ct = default);
}

public record CreateCashoutInput
{
    public required Guid MerchantId { get; init; }
    public required ApiEnvironment Environment { get; init; }
    public required long Amount { get; init; }
    public Guid? PayoutAccountId { get; init; }
    public Guid? MerchantAcquirerId { get; init; }
    public string? ExternalId { get; init; }
    public string? CallbackUrl { get; init; }
    public required string IpAddress { get; init; }
    public string? PixKey { get; init; }
    public string? PixKeyType { get; init; }
}

public record CreateCashoutInternalInput
{
    public required Guid MerchantId { get; init; }
    public required Guid UserId { get; init; }
    public required long Amount { get; init; }
    public Guid? PayoutAccountId { get; init; }
    public Guid? MerchantAcquirerId { get; init; }
    public required string IpAddress { get; init; }
    public string? Location { get; init; }
    public ApiEnvironment Environment { get; init; } = ApiEnvironment.Production;
    public bool ConsolidateAllAcquirers { get; init; }
}

public record CreateCashoutResult
{
    public bool Success { get; init; }
    public Payout? Payout { get; init; }
    public List<Payout>? Payouts { get; init; }
    public MerchantPayoutAccount? PayoutAccount { get; init; }
    public bool RequiresApproval { get; init; }
    public string? ErrorMessage { get; init; }
    public string? ErrorCode { get; init; }
    public int StatusCode { get; init; } = 200;

    public static CreateCashoutResult Fail(string message, string? code = null, int statusCode = 400) => new()
    {
        Success = false,
        ErrorMessage = message,
        ErrorCode = code,
        StatusCode = statusCode
    };
}

public record GetCashoutResult
{
    public bool Success { get; init; }
    public Payout? Payout { get; init; }
    public MerchantPayoutAccount? PayoutAccount { get; init; }
    public string? ErrorMessage { get; init; }
    public string? ErrorCode { get; init; }
    public int StatusCode { get; init; } = 200;

    public static GetCashoutResult Fail(string message, string? code = null, int statusCode = 400) => new()
    {
        Success = false,
        ErrorMessage = message,
        ErrorCode = code,
        StatusCode = statusCode
    };
}

public record ListCashoutInput
{
    public required Guid MerchantId { get; init; }
    public required ApiEnvironment Environment { get; init; }
    public PayoutStatus? Status { get; init; }
    public DateTime? StartDate { get; init; }
    public DateTime? EndDate { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
}

public record ListCashoutResult
{
    public bool Success { get; init; }
    public List<CashoutListItem> Items { get; init; } = [];
    public int TotalItems { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalPages { get; init; }
    public string? ErrorMessage { get; init; }
    public string? ErrorCode { get; init; }
    public int StatusCode { get; init; } = 200;

    public static ListCashoutResult Fail(string message, string? code = null, int statusCode = 400) => new()
    {
        Success = false,
        ErrorMessage = message,
        ErrorCode = code,
        StatusCode = statusCode
    };
}

public record CashoutListItem
{
    public Guid Id { get; init; }
    public long Amount { get; init; }
    public long Fee { get; init; }
    public long NetAmount { get; init; }
    public PayoutStatus Status { get; init; }
    public string? PixKeyType { get; init; }
    public string? PixKey { get; init; }
    public string? EndToEndId { get; init; }
    public string? FailureReason { get; init; }
    public DateTime RequestedAt { get; init; }
    public DateTime? CompletedAt { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record ApproveCashoutResult
{
    public bool Success { get; init; }
    public Guid? CashoutId { get; init; }
    public PayoutStatus? Status { get; init; }
    public string? AcquirerTransactionId { get; init; }
    public string? ErrorMessage { get; init; }
    public string? ErrorCode { get; init; }
    public int StatusCode { get; init; } = 200;

    public static ApproveCashoutResult Fail(string message, string? code = null, int statusCode = 400) => new()
    {
        Success = false,
        ErrorMessage = message,
        ErrorCode = code,
        StatusCode = statusCode
    };
}

public record RejectCashoutResult
{
    public bool Success { get; init; }
    public Guid? CashoutId { get; init; }
    public PayoutStatus? Status { get; init; }
    public string? ErrorMessage { get; init; }
    public string? ErrorCode { get; init; }
    public int StatusCode { get; init; } = 200;

    public static RejectCashoutResult Fail(string message, string? code = null, int statusCode = 400) => new()
    {
        Success = false,
        ErrorMessage = message,
        ErrorCode = code,
        StatusCode = statusCode
    };
}

public record CancelCashoutResult
{
    public bool Success { get; init; }
    public Guid? CashoutId { get; init; }
    public PayoutStatus? Status { get; init; }
    public string? ErrorMessage { get; init; }
    public string? ErrorCode { get; init; }
    public int StatusCode { get; init; } = 200;

    public static CancelCashoutResult Fail(string message, string? code = null, int statusCode = 400) => new()
    {
        Success = false,
        ErrorMessage = message,
        ErrorCode = code,
        StatusCode = statusCode
    };
}

public record AcquirerCashoutWebhookData
{
    public required AcquirerType AcquirerType { get; init; }
    public required string TxId { get; init; }
    public required PayoutStatus Status { get; init; }
    public string? ExternalId { get; init; }
    public string? EndToEndId { get; init; }
    public string? AcquirerTransactionId { get; init; }
    public string? PixKey { get; init; }
    public string? PixKeyType { get; init; }
    public long? Amount { get; init; }
    public string? ReceiverName { get; init; }
    public string? ReceiverDocument { get; init; }
    public string? RejectReason { get; init; }
    public DateTime? CompletedAt { get; init; }
}

public record ProcessCashoutWebhookResult
{
    public bool Success { get; init; }
    public bool PayoutNotFound { get; init; }
    public Guid? PayoutId { get; init; }
    public PayoutStatus? Status { get; init; }
    public bool UsedFallbackCorrelation { get; init; }
    public string? ErrorMessage { get; init; }
}

public record SimulateCashoutResult
{
    public bool Success { get; init; }
    public Guid? CashoutId { get; init; }
    public PayoutStatus? Status { get; init; }
    public string? EndToEndId { get; init; }
    public string? AcquirerTransactionId { get; init; }
    public string? ErrorMessage { get; init; }
    public string? ErrorCode { get; init; }
    public int StatusCode { get; init; } = 200;

    public static SimulateCashoutResult Fail(string message, string? code = null, int statusCode = 400) => new()
    {
        Success = false,
        ErrorMessage = message,
        ErrorCode = code,
        StatusCode = statusCode
    };
}
