namespace Swiftpay.Domain.Entities;

public class Acquirer
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsSelected { get; set; }
    public Guid CompanyId { get; set; }
}
