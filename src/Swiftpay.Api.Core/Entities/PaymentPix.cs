namespace Swiftpay.Domain.Entities;

public class PaymentPix
{
    public Guid Id { get; set; }
    public Guid PaymentId { get; set; }
    public string? TxId { get; set; }
    public string? QrCodePayload { get; set; }
    public string? QrCodeBase64 { get; set; }
    public string? CopyAndPaste { get; set; }
    public string? EndToEndId { get; set; }
    public string? PixKey { get; set; }
    public string? PixKeyType { get; set; }
    public string? PayerName { get; set; }
    public string? PayerDocument { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime? PaidAt { get; set; }
    public Payment Payment { get; set; } = null!;
}
