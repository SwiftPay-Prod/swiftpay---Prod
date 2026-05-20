using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Merchants.Products.DigitalItems.DeleteDigitalItem;

public sealed class DeleteDigitalItemRequest
{
    public Guid MerchantId { get; set; }
    public Guid ProductId { get; set; }
    public Guid ItemId { get; set; }
}

public sealed class DeleteDigitalItemValidator : Validator<DeleteDigitalItemRequest>
{
    public DeleteDigitalItemValidator()
    {
        RuleFor(x => x.MerchantId).NotEmpty().WithMessage("O identificador da organização é obrigatório.");
        RuleFor(x => x.ProductId).NotEmpty().WithMessage("O identificador do produto é obrigatório.");
        RuleFor(x => x.ItemId).NotEmpty().WithMessage("O identificador do item é obrigatório.");
    }
}

public sealed class DeleteDigitalItemResponse : BaseResponse;
