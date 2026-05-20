using safefy_api_core.Models.Database;

namespace safefy_api_core.Interfaces;

/// <summary>
/// Service for handling digital item delivery to customers.
/// </summary>
public interface IDigitalDeliveryService
{
    /// <summary>
    /// Process digital item delivery for a completed payment/order.
    /// This will:
    /// 1. Find all digital products in the order
    /// 2. Reserve/assign available digital items
    /// 3. Mark items as delivered
    /// 4. Send delivery email to customer
    /// </summary>
    Task<DigitalDeliveryResult> ProcessDeliveryAsync(
        Guid paymentId,
        Guid merchantId,
        Guid? orderId,
        string? customerEmail,
        string? customerName,
        string environment,
        CancellationToken ct = default);

    /// <summary>
    /// Gets the delivery status for an order item.
    /// </summary>
    Task<IReadOnlyList<DigitalItem>> GetDeliveredItemsAsync(
        Guid orderItemId,
        CancellationToken ct = default);

    /// <summary>
    /// Resend digital items delivery email.
    /// </summary>
    Task<bool> ResendDeliveryEmailAsync(
        Guid paymentId,
        CancellationToken ct = default);
}

/// <summary>
/// Result of a digital delivery operation.
/// </summary>
public sealed class DigitalDeliveryResult
{
    /// <summary>
    /// Whether the delivery was successful.
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Error message if delivery failed.
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Number of items delivered.
    /// </summary>
    public int ItemsDelivered { get; set; }

    /// <summary>
    /// List of products that had no available items.
    /// </summary>
    public List<string> ProductsWithNoStock { get; set; } = [];

    /// <summary>
    /// Whether the email was sent successfully.
    /// </summary>
    public bool EmailSent { get; set; }
}
