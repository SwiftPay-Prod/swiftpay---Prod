using System.Text.Json.Serialization;
using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api.Validators;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Merchants.Products.DigitalItems.ReadListDigitalItems;

public sealed class ReadListDigitalItemsRequest : IPaginatedRequest
{
    public Guid MerchantId { get; set; }
    public Guid ProductId { get; set; }
    public Guid? VariantId { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public DigitalItemStatus? Status { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public sealed class ReadListDigitalItemsValidator : Validator<ReadListDigitalItemsRequest>
{
    public ReadListDigitalItemsValidator()
    {
        RuleFor(x => x.MerchantId).NotEmpty().WithMessage("O identificador da organização é obrigatório.");
        RuleFor(x => x.ProductId).NotEmpty().WithMessage("O identificador do produto é obrigatório.");
        RuleFor(x => x.Page).ValidPage();
        RuleFor(x => x.PageSize).ValidPageSize();
    }
}

public sealed class ReadListDigitalItemsResponse : BaseResponse<ReadListDigitalItemsData>;

public sealed class ReadListDigitalItemsData
{
    public Paginated<MinimalDigitalItem> Items { get; set; } = new();
    public DigitalItemStats Stats { get; set; } = new();
}

public sealed class MinimalDigitalItem
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public Guid? VariantId { get; set; }
    public string? VariantName { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public DigitalItemType Type { get; set; }
    public string Content { get; set; } = string.Empty;
    public string ContentPreview { get; set; } = string.Empty;
    public string? Label { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public DigitalItemStatus Status { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public Guid? DeliveredToOrderId { get; set; }
    public string? DeliveredToOrderNumber { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class DigitalItemStats
{
    public int TotalItems { get; set; }
    public int AvailableItems { get; set; }
    public int DeliveredItems { get; set; }
    public int ReservedItems { get; set; }
    public int DisabledItems { get; set; }
    public List<Guid> VariantIdsWithItems { get; set; } = [];
}
