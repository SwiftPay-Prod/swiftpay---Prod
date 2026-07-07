namespace swiftpay_api_core.Models.MassTransit;

/// <summary>
/// Message to trigger digital item delivery after payment completion.
/// </summary>
public sealed class ProcessDigitalDeliveryMessage
{
    /// <summary>
    /// The ID of the completed payment.
    /// </summary>
    public Guid PaymentId { get; set; }

    /// <summary>
    /// The ID of the merchant.
    /// </summary>
    public Guid MerchantId { get; set; }

    /// <summary>
    /// The ID of the order (if applicable).
    /// </summary>
    public Guid? OrderId { get; set; }

    /// <summary>
    /// The ID of the customer who made the purchase.
    /// </summary>
    public Guid? CustomerId { get; set; }

    /// <summary>
    /// Customer email address for delivery.
    /// </summary>
    public string? CustomerEmail { get; set; }

    /// <summary>
    /// Customer name for personalization.
    /// </summary>
    public string? CustomerName { get; set; }

    /// <summary>
    /// The environment (Sandbox or Production).
    /// </summary>
    public string Environment { get; set; } = "Production";
}
