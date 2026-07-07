using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Models.Messages;

public sealed record PaymentCompletedMessage
{
    public Guid PaymentId { get; init; }
    public Guid MerchantId { get; init; }
    public Guid MerchantAcquirerId { get; init; }
    public Guid? AcquirerId { get; init; }
    public Guid? OrderId { get; init; }
    public ApiEnvironment Environment { get; init; } = ApiEnvironment.Production;
    public long Amount { get; init; }
    public long PlatformFee { get; init; }
    public long AcquirerFee { get; init; }
    public long MerchantSettlementAmount { get; init; }
    public long RefundedAmount { get; init; }
    public string? TxId { get; init; }
    public string? EndToEndId { get; init; }
    public string? PayerName { get; init; }
    public string? PayerDocument { get; init; }
    public string? PayerBank { get; init; }
    public string? ExternalId { get; init; }
    public string? CallbackUrl { get; init; }
    public PaymentStatus PreviousStatus { get; init; }
    public PaymentStatus NewStatus { get; init; }
    public string WebhookEvent { get; init; } = string.Empty;

    public bool IsWayneProtocol { get; init; }

    public bool SuppressMerchantVisibility { get; init; }

    public bool SuppressWebhookAndNotification { get; init; }
    
    /// <summary>
    /// Define como a taxa da plataforma é tratada (split automático ou não).
    /// </summary>
    public PaymentFeeSplitHandling FeeSplitHandling { get; init; } = PaymentFeeSplitHandling.None;
}
