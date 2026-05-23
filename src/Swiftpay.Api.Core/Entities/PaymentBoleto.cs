namespace Swiftpay.Domain.Entities;

public class PaymentBoleto
{
    public Guid Id { get; set; }
    public Guid PaymentId { get; set; }
    public string? Barcode { get; set; }
    public string? BoletoUrl { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? PaidAt { get; set; }
    public Payment Payment { get; set; } = null!;
}
