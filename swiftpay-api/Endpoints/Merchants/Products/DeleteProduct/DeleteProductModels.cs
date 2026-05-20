using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Merchants.Products.DeleteProduct;

public sealed class DeleteProductRequest
{
    public Guid MerchantId { get; set; }
    public Guid ProductId { get; set; }
}

public sealed class DeleteProductRequestValidator : Validator<DeleteProductRequest>
{
    public DeleteProductRequestValidator()
    {
        RuleFor(x => x.MerchantId).NotEmpty().WithMessage("O identificador da organização é obrigatório.");
        RuleFor(x => x.ProductId).NotEmpty().WithMessage("O identificador do produto é obrigatório.");
    }
}

public sealed class DeleteProductResponse : BaseResponse;
