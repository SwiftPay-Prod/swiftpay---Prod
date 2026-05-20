using System.Text.Json.Serialization;
using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Merchants.Products.DigitalItems.CreateDigitalItem;

public sealed class CreateDigitalItemRequest
{
    public Guid MerchantId { get; set; }
    public Guid ProductId { get; set; }
    public Guid? VariantId { get; set; }
    public DigitalItemType Type { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? Label { get; set; }
}

public sealed class CreateDigitalItemValidator : Validator<CreateDigitalItemRequest>
{
    public CreateDigitalItemValidator()
    {
        RuleFor(x => x.MerchantId).NotEmpty().WithMessage("O identificador da organização é obrigatório.");
        RuleFor(x => x.ProductId).NotEmpty().WithMessage("O identificador do produto é obrigatório.");
        RuleFor(x => x.Content).NotEmpty().WithMessage("O conteúdo do item é obrigatório.")
            .MaximumLength(2000).WithMessage("O conteúdo deve ter no máximo 2000 caracteres.");
        RuleFor(x => x.Label).MaximumLength(200).WithMessage("O rótulo deve ter no máximo 200 caracteres.");
    }
}

public sealed class CreateDigitalItemResponse : BaseResponse<DigitalItemData>;

public sealed class DigitalItemData
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public Guid? VariantId { get; set; }
    public DigitalItemType Type { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? Label { get; set; }
    public DigitalItemStatus Status { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public Guid? DeliveredToOrderId { get; set; }
    public Guid? DeliveredToOrderItemId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
