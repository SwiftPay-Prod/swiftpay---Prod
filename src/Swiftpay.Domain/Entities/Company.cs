using Swiftpay.Domain.Enums;

namespace Swiftpay.Domain.Entities;

public class Company
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Document { get; set; } = string.Empty;
    public KycStatus KycStatus { get; set; } = KycStatus.Pending;
    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<Acquirer> Acquirers { get; set; } = new List<Acquirer>();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
