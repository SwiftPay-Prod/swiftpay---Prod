using System.Text.Json.Serialization;
using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Merchants.Products.DigitalItems.CreateDigitalItem;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Merchants.Products.DigitalItems.UpdateDigitalItem;

public sealed class UpdateDigitalItemRequest
{
    public Guid MerchantId { get; set; }
    public Guid ProductId { get; set; }
    public Guid ItemId { get; set; }
    public string? Content { get; set; }
    public string? Label { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public DigitalItemStatus? Status { get; set; }
}

public sealed class UpdateDigitalItemValidator : Validator<UpdateDigitalItemRequest>
{
    public UpdateDigitalItemValidator()
    {
        RuleFor(x => x.MerchantId).NotEmpty().WithMessage("O identificador da organização é obrigatório.");
        RuleFor(x => x.ProductId).NotEmpty().WithMessage("O identificador do produto é obrigatório.");
        RuleFor(x => x.ItemId).NotEmpty().WithMessage("O identificador do item é obrigatório.");
        RuleFor(x => x.Content).MaximumLength(2000).WithMessage("O conteúdo deve ter no máximo 2000 caracteres.");
        RuleFor(x => x.Label).MaximumLength(200).WithMessage("O rótulo deve ter no máximo 200 caracteres.");
    }
}

public sealed class UpdateDigitalItemResponse : BaseResponse<DigitalItemData>;
