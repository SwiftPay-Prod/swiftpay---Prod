using Swiftpay.Domain.Enums;
using Swiftpay.Domain.ValueObjects;

namespace Swiftpay.Domain.Entities;

public class Withdrawal
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Money Amount { get; set; } = new(0);
    public WithdrawalStatus Status { get; set; } = WithdrawalStatus.Pending;
    public string PixKey { get; set; } = string.Empty;
    public string PixKeyType { get; set; } = string.Empty;
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}
