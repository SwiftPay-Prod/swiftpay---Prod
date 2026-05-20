using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api_core.Interfaces;

public interface IStockService
{
    Task<StockValidationResult> ValidateAvailabilityAsync(
        Guid productId,
        Guid? variantId,
        int requestedQuantity,
        Guid? excludeOrderId = null,
        CancellationToken ct = default);

    Task<StockReservationResult> ReserveForOrderAsync(
        Order order,
        CancellationToken ct = default);

    Task<bool> ConfirmReservationAsync(
        Guid orderId,
        CancellationToken ct = default);

    Task<bool> ReleaseReservationAsync(
        Guid orderId,
        string? notes = null,
        CancellationToken ct = default);

    Task<int?> GetAvailableStockAsync(
        Guid productId,
        Guid? variantId,
        Guid? excludeOrderId = null,
        CancellationToken ct = default);

    Task<StockInfo> GetStockInfoAsync(
        Guid productId,
        Guid? variantId,
        int requestedQuantity,
        Guid? excludeOrderId = null,
        CancellationToken ct = default);

    Task<bool> ReserveDigitalItemsAsync(
        Order order,
        CancellationToken ct = default);

    Task<bool> ConfirmDigitalItemsAsync(
        Guid orderId,
        CancellationToken ct = default);

    Task<bool> ReleaseDigitalItemsAsync(
        Guid orderId,
        CancellationToken ct = default);
}

public class StockValidationResult
{
    public bool IsValid { get; set; }
    public int? AvailableStock { get; set; }
    public int RequestedQuantity { get; set; }
    public string? ErrorMessage { get; set; }

    public static StockValidationResult Success(int? available, int requested) =>
        new() { IsValid = true, AvailableStock = available, RequestedQuantity = requested };

    public static StockValidationResult InfiniteStock(int requested) =>
        new() { IsValid = true, AvailableStock = null, RequestedQuantity = requested };

    public static StockValidationResult InsufficientStock(int? available, int requested) =>
        new()
        {
            IsValid = false,
            AvailableStock = available,
            RequestedQuantity = requested,
            ErrorMessage = available.HasValue
                ? $"Estoque insuficiente. Disponível: {available.Value}, Solicitado: {requested}"
                : "Produto sem estoque disponível."
        };

    public static StockValidationResult ProductNotFound() =>
        new() { IsValid = false, ErrorMessage = "Produto não encontrado." };

    public static StockValidationResult Failed(string message) =>
        new() { IsValid = false, ErrorMessage = message };
}

public class StockReservationResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public List<StockReservationItemResult> Items { get; set; } = [];

    public static StockReservationResult Succeeded(List<StockReservationItemResult> items) =>
        new() { Success = true, Items = items };

    public static StockReservationResult Failed(string message) =>
        new() { Success = false, ErrorMessage = message };
}

public class StockReservationItemResult
{
    public Guid ProductId { get; set; }
    public Guid? VariantId { get; set; }
    public int Quantity { get; set; }
    public int? AvailableBefore { get; set; }
    public int? AvailableAfter { get; set; }
}

public class StockInfo
{
    public int? StockQuantity { get; set; }
    public bool IsInStock { get; set; }
    public bool IsDigitalProduct { get; set; }

    public static StockInfo ForDigital(int availableCount, int requestedQuantity) =>
        new()
        {
            StockQuantity = availableCount,
            IsInStock = availableCount >= requestedQuantity,
            IsDigitalProduct = true
        };

    public static StockInfo ForUnlimited(bool isDigitalProduct) =>
        new()
        {
            StockQuantity = null,
            IsInStock = true,
            IsDigitalProduct = isDigitalProduct
        };

    public static StockInfo ForPhysical(int? stockQuantity, int requestedQuantity) =>
        new()
        {
            StockQuantity = stockQuantity,
            IsInStock = stockQuantity == null || stockQuantity >= requestedQuantity,
            IsDigitalProduct = false
        };

    public static StockInfo NotFound() =>
        new()
        {
            StockQuantity = 0,
            IsInStock = false,
            IsDigitalProduct = false
        };
}
