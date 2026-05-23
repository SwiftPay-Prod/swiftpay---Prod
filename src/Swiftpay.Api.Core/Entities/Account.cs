using Swiftpay.Domain.Enums;

namespace Swiftpay.Domain.Entities;

public class Account
{
    public Guid Id { get; set; }
    public AccountType Type { get; set; }
    public Guid? MerchantId { get; set; }
    public Guid? AcquirerId { get; set; }
    public Guid? MerchantAcquirerId { get; set; }
    public string Currency { get; set; } = "BRL";
    public long Balance { get; set; }
    public string Environment { get; set; } = "production";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
