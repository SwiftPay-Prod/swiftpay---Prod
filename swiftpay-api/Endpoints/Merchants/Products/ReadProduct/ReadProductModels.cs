using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Merchants.Products.ReadProduct;

public sealed class ReadProductRequest
{
    public Guid MerchantId { get; set; }
    public Guid ProductId { get; set; }
}

public sealed class ReadProductRequestValidator : Validator<ReadProductRequest>
{
    public ReadProductRequestValidator()
    {
        RuleFor(x => x.MerchantId).NotEmpty().WithMessage("O identificador da organização é obrigatório.");
        RuleFor(x => x.ProductId).NotEmpty().WithMessage("O identificador do produto é obrigatório.");
    }
}

public sealed class ReadProductResponse : BaseResponse<ProductData>;
