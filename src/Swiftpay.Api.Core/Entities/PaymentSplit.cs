namespace Swiftpay.Domain.Entities;

public class PaymentSplit
{
    public Guid Id { get; set; }
    public Guid PaymentId { get; set; }
    public string RecipientId { get; set; } = string.Empty;
    public long Amount { get; set; }
    public int Percent { get; set; }
    public string Currency { get; set; } = "BRL";
    public Payment Payment { get; set; } = null!;
}
