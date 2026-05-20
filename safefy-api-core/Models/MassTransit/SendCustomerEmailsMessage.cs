namespace safefy_api_core.Models.MassTransit;

public sealed class SendCustomerEmailsMessage
{
    public required Guid PaymentId { get; set; }
    public required Guid MerchantId { get; set; }
    public Guid? OrderId { get; set; }
    public Guid? CustomerId { get; set; }
    public required string CustomerEmail { get; set; }
    public string? CustomerName { get; set; }
    public required string Environment { get; set; }
}
