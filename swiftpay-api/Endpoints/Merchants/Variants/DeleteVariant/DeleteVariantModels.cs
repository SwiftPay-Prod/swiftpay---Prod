using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api.Endpoints.Merchants.Products;

namespace swiftpay_api.Endpoints.Merchants.Variants.DeleteVariant;

public sealed class DeleteVariantRequest
{
    public Guid MerchantId { get; set; }
    public Guid ProductId { get; set; }
    public Guid VariantId { get; set; }
}

public sealed class DeleteVariantRequestValidator : Validator<DeleteVariantRequest>
{
    public DeleteVariantRequestValidator()
    {
        RuleFor(x => x.MerchantId).NotEmpty().WithMessage("O identificador da organização é obrigatório.");
        RuleFor(x => x.ProductId).NotEmpty().WithMessage("O identificador do produto é obrigatório.");
        RuleFor(x => x.VariantId).NotEmpty().WithMessage("O identificador da variante é obrigatório.");
    }
}

public sealed class DeleteVariantResponse : BaseResponse;
