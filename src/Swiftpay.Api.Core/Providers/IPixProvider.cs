namespace Swiftpay.Api.Core.Providers;

public record PixGenerationRequest(
    long Amount, string Description, string ExternalRef,
    string NotificationUrl, string PayerName, string PayerTaxId,
    string PayerEmail, string PayerPhone);

public record PixGenerationResult(
    bool Success, string? TransactionId, string? QrCodePayload,
    string? CopyAndPaste, string? ErrorMessage);

public record PixStatusResult(
    bool Success, string Status, string? EndToEndId,
    string? PayerName, string? PayerDocument, DateTime? PaidAt,
    string? ErrorMessage);

public record PixRefundResult(bool Success, string? ErrorMessage);

public interface IPixProvider
{
    string ProviderName { get; }
    Task<PixGenerationResult> GeneratePixAsync(PixGenerationRequest request, CancellationToken ct);
    Task<PixStatusResult> GetPixStatusAsync(string transactionId, CancellationToken ct);
    Task<PixRefundResult> RefundAsync(string transactionId, long amount, CancellationToken ct);
}
