using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api_payment.Interfaces;

public interface IPixService
{
    Task<PixGenerationResult> GeneratePixAsync(
        Guid merchantId,
        long amount,
        string? description,
        string? externalId,
        ApiEnvironment environment,
        int expirationMinutes = 30,
        string? customerName = null,
        string? customerDocument = null,
        string? customerEmail = null,
        string? customerPhone = null,
        Guid? merchantAcquirerId = null);
    Task<PixStatusResult> GetPixStatusAsync(Guid merchantId, string txId, ApiEnvironment environment);
}

public record PixGenerationResult
{
    public bool Success { get; init; }
    public Guid? AcquirerId { get; init; }
    public Guid? MerchantAcquirerId { get; init; }
    public string? AcquirerPaymentId { get; init; }
    public string? TxId { get; init; }
    public string? QrCode { get; init; }
    public string? CopyAndPaste { get; init; }
    public DateTime? ExpiresAt { get; init; }
    public string? ErrorMessage { get; init; }
}

public record PixStatusResult
{
    public bool Success { get; init; }
    public PaymentStatus Status { get; init; }
    public string? EndToEndId { get; init; }
    public string? PayerName { get; init; }
    public string? PayerDocument { get; init; }
    public string? PayerBank { get; init; }
    public DateTime? CompletedAt { get; init; }
    public string? ErrorMessage { get; init; }
}
