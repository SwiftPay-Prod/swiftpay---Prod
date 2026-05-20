using safefy_api_core.Models.Enum;

namespace safefy_api_payment.Interfaces;

public interface IWithdrawService
{
    Task<WithdrawServiceResult> ProcessWithdrawAsync(
        Guid merchantId,
        Guid payoutId,
        Guid merchantAcquirerId,
        Guid acquirerId,
        long amount,
        string pixKey,
        string? pixKeyType,
        ApiEnvironment environment);

    Task<WithdrawServiceResult> ProcessPlatformWithdrawAsync(
        Guid payoutItemId,
        Guid acquirerId,
        long amount,
        string pixKey,
        string? pixKeyType,
        ApiEnvironment environment);
}

public record WithdrawServiceResult
{
    public bool Success { get; init; }
    public WithdrawStatus Status { get; init; }
    public string? AcquirerTransactionId { get; init; }
    public string? AcquirerTxId { get; init; }
    public string? ErrorMessage { get; init; }
}
