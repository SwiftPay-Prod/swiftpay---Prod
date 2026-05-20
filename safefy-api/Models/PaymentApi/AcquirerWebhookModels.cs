using safefy_api_core.Models.Database;

namespace safefy_api.Models.PaymentApi;

public sealed class ReprocessAcquirerWebhookDevApiInput
{
    public Guid WebhookLogId { get; set; }
}

public sealed class ReprocessAcquirerWebhookDevApiResult
{
    public bool Success { get; set; }
    public Guid WebhookLogId { get; set; }
    public string? AcquirerType { get; set; }
    public Guid? PaymentId { get; set; }
    public Guid? PayoutId { get; set; }
    public string? Status { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
}

public sealed class ForceAcquirerWebhookDevApiInput
{
    public AcquirerType AcquirerType { get; set; }
    public string PayloadJson { get; set; } = string.Empty;
}

public sealed class ForceAcquirerWebhookDevApiResult
{
    public bool Success { get; set; }
    public AcquirerType AcquirerType { get; set; }
    public string? TxId { get; set; }
    public string? Status { get; set; }
    public bool Processed { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
}
