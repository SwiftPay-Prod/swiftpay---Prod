using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api_payment.Services.Sandbox;

public interface ISandboxService
{
    SandboxPixData GenerateSandboxPixData(long amount, string? description, int expirationMinutes);

    SandboxPayerData GenerateSandboxPayerData();

    SandboxPayoutData GenerateSandboxPayoutData(long amount, string pixKey, string? pixKeyType);

    Task<SandboxSimulationResult> SimulatePaymentAsync(
        Payment payment,
        SimulateAction action,
        CancellationToken ct = default);

    Task<SandboxSimulationResult> SimulateCashoutAsync(
        Payout payout,
        SimulateCashoutAction action,
        CancellationToken ct = default);
}

public enum SimulateAction
{
    Complete,
    Expire,
    Fail,
    Refund
}

public enum SimulateCashoutAction
{
    Complete,
    Fail,
    Reject
}

public record SandboxPixData
{
    public required string TxId { get; init; }
    public required string QrCode { get; init; }
    public required string CopyAndPaste { get; init; }
    public required DateTime ExpiresAt { get; init; }
}

public record SandboxPayerData
{
    public required string EndToEndId { get; init; }
    public required string PayerName { get; init; }
    public required string PayerDocument { get; init; }
    public required string PayerBank { get; init; }
}

public record SandboxPayoutData
{
    public required string AcquirerTransactionId { get; init; }
    public required string EndToEndId { get; init; }
}

public record SandboxSimulationResult
{
    public bool Success { get; init; }
    public string? ErrorMessage { get; init; }
    public string? ErrorCode { get; init; }
    public int StatusCode { get; init; } = 200;

    public static SandboxSimulationResult Ok() => new() { Success = true };
    public static SandboxSimulationResult Fail(string message, string? code = null, int statusCode = 400) => new()
    {
        Success = false,
        ErrorMessage = message,
        ErrorCode = code,
        StatusCode = statusCode
    };
}
