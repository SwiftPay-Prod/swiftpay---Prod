namespace Swiftpay.Api.Core.Providers;

public record PixGenerationRequest(
    long Amount, string Description, string ExternalRef,
    string NotificationUrl, string PayerName, string PayerTaxId,
    string PayerEmail, string PayerPhone, string Method = "PIX")
{
    public string? CardToken { get; init; }
    public int Installments { get; init; } = 1;
}

public record PixGenerationResult(
    bool Success, string? TransactionId, string? QrCodePayload,
    string? CopyAndPaste, string? ErrorMessage,
    string? QrCodeBase64 = null, string? Barcode = null, string? BoletoUrl = null,
    string? AuthorizationCode = null);

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
