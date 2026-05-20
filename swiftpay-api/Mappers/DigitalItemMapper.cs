using safefy_api.Endpoints.Merchants.Products.DigitalItems.CreateDigitalItem;
using safefy_api.Endpoints.Merchants.Products.DigitalItems.ReadListDigitalItems;
using safefy_api_core.Models.Database;

namespace safefy_api.Mappers;

public static class DigitalItemMapper
{
    public static DigitalItemData ToData(DigitalItem item)
    {
        return new DigitalItemData
        {
            Id = item.Id,
            ProductId = item.ProductId,
            VariantId = item.VariantId,
            Type = item.Type,
            Content = item.Content,
            Label = item.Label,
            Status = item.Status,
            DeliveredAt = item.DeliveredAt,
            DeliveredToOrderId = item.DeliveredToOrderId,
            DeliveredToOrderItemId = item.DeliveredToOrderItemId,
            CreatedAt = item.CreatedAt,
            UpdatedAt = item.UpdatedAt
        };
    }

    public static MinimalDigitalItem ToMinimalData(DigitalItem item)
    {
        return new MinimalDigitalItem
        {
            Id = item.Id,
            ProductId = item.ProductId,
            VariantId = item.VariantId,
            VariantName = item.Variant?.Name,
            Type = item.Type,
            Content = item.Content,
            ContentPreview = item.Content.Length > 20 ? item.Content[..20] + "..." : item.Content,
            Label = item.Label,
            Status = item.Status,
            DeliveredAt = item.DeliveredAt,
            DeliveredToOrderId = item.DeliveredToOrderId,
            DeliveredToOrderNumber = item.DeliveredToOrder?.OrderNumber,
            CreatedAt = item.CreatedAt
        };
    }
}
