using safefy_api_core.Models.Database;

namespace safefy_api_payment.Interfaces;

public interface IAcquirerService
{
    AcquirerType AcquirerType { get; }
    Task<PixGenerationResult> GeneratePixAsync(AcquirerConfig config, PixGenerationRequest request);
    Task<PixStatusResult> GetPixStatusAsync(AcquirerConfig config, string txId);
    Task<WithdrawResult> WithdrawAsync(AcquirerConfig config, WithdrawRequest request);
}

public record WithdrawRequest
{
    public required Guid PayoutId { get; init; }
    public required long Amount { get; init; }
    public required string PixKey { get; init; }
    public string? PixKeyType { get; init; }
}

public record WithdrawResult
{
    public bool Success { get; init; }
    public WithdrawStatus Status { get; init; }
    public string? AcquirerTransactionId { get; init; }
    public string? AcquirerTxId { get; init; }
    public string? ErrorMessage { get; init; }
}

public enum WithdrawStatus
{
    Processing,
    Completed,
    Failed,
    Cancelled
}

public record AcquirerConfig
{
    public required Guid AcquirerId { get; init; }
    public required AcquirerType AcquirerType { get; init; }
    public Guid? MerchantId { get; init; }
    public required string ApiBaseUrl { get; init; }

    /// <summary>
    /// Credenciais genéricas em formato Dictionary.
    /// Keys dependem do tipo de adquirente (ex: "secretKey", "companyId", "token", "clientId", "clientSecret").
    /// </summary>
    public required Dictionary<string, string> Credentials { get; init; }

    public string? WebhookSecret { get; init; }
    public string? WebhookToken { get; init; }
    public string? PlatformBaseUrl { get; init; }
    public Dictionary<string, string>? AdditionalSettings { get; init; }
    public bool IsSandbox { get; init; }
    public bool IsSimulated { get; init; }

    /// <summary>
    /// Obtém uma credencial pelo nome. Retorna null se não existir.
    /// </summary>
    public string? GetCredential(string key)
        => Credentials.TryGetValue(key, out var value) && !string.IsNullOrEmpty(value) ? value : null;

    /// <summary>
    /// Obtém uma credencial obrigatória pelo nome. Lança exceção se não existir ou estiver vazia.
    /// </summary>
    public string GetRequiredCredential(string key)
        => Credentials.TryGetValue(key, out var value) && !string.IsNullOrEmpty(value)
            ? value
            : throw new InvalidOperationException($"Credencial '{key}' é obrigatória mas não está configurada para a adquirente.");

    /// <summary>
    /// Verifica se uma credencial existe e não está vazia.
    /// </summary>
    public bool HasCredential(string key)
        => Credentials.TryGetValue(key, out var value) && !string.IsNullOrEmpty(value);
}

public record PixGenerationRequest
{
    public required long Amount { get; init; }
    public string? Description { get; init; }
    public string? ExternalId { get; init; }
    public int ExpirationMinutes { get; init; } = 30;
    public string? CustomerName { get; init; }
    public string? CustomerDocument { get; init; }
    public string? CustomerEmail { get; init; }
    public string? CustomerPhone { get; init; }
}
