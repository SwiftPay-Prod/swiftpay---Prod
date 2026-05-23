namespace Swiftpay.Domain.Entities;

public class Payment
{
    public Guid Id { get; set; }
    public Guid MerchantId { get; set; }
    public Guid? MerchantAcquirerId { get; set; }
    public long Amount { get; set; }
    public long PlatformFee { get; set; }
    public long AcquirerFee { get; set; }
    public long NetAmount { get; set; }
    public long MerchantSettlementAmount { get; set; }
    public long AcquirerNetAmount { get; set; }
    public string Status { get; set; } = "PENDING";
    public string Method { get; set; } = "PIX";
    public string? ExternalId { get; set; }
    public string? AcquirerPaymentId { get; set; }
    public string? NotificationUrl { get; set; }
    public string? FailureReason { get; set; }
    public string Environment { get; set; } = "production";
    public Guid? PaymentLinkId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PaidAt { get; set; }
    public DateTime? RefundedAt { get; set; }
    public PaymentPix? Pix { get; set; }
    public PaymentBoleto? Boleto { get; set; }
}
