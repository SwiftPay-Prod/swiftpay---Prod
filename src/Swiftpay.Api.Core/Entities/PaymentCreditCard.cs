namespace Swiftpay.Domain.Entities;

public class PaymentCreditCard
{
    public Guid Id { get; set; }
    public Guid PaymentId { get; set; }
    public string? CardToken { get; set; }
    public string? LastDigits { get; set; }
    public string? CardHolder { get; set; }
    public int Installments { get; set; } = 1;
    public string? AuthorizationCode { get; set; }
    public string? Tid { get; set; }
    public DateTime? PaidAt { get; set; }
    public Payment Payment { get; set; } = null!;
}
