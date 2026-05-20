using safefy_api_core.Models.Database;

namespace safefy_api_payment.Interfaces;

public interface IPaymentProcessingService
{
    Task<PaymentProcessingResult> ProcessAcquirerWebhookAsync(AcquirerWebhookData webhookData, CancellationToken ct = default);
}

public record AcquirerWebhookData
{
    public required AcquirerType AcquirerType { get; init; }
    public required string AcquirerPaymentId { get; init; }
    public Guid? ExternalId { get; init; }
    public string? TxId { get; init; }
    public required PaymentStatus Status { get; init; }
    public string? EndToEndId { get; init; }
    public string? PayerName { get; init; }
    public string? PayerDocument { get; init; }
    public string? PayerBank { get; init; }
    public string? ErrorMessage { get; init; }
    public long? RefundedAmount { get; init; }
}

public record PaymentProcessingResult
{
    public bool Success { get; init; }
    public Guid? PaymentId { get; init; }
    public PaymentStatus? NewStatus { get; init; }
    public string? ErrorMessage { get; init; }
    public bool PaymentNotFound { get; init; }
    public bool AlreadyProcessed { get; init; }
}
