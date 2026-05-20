using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api.Endpoints.Merchants.Products;

namespace safefy_api.Endpoints.Merchants.Variants.ReadVariant;

public sealed class ReadVariantRequest
{
    public Guid MerchantId { get; set; }
    public Guid ProductId { get; set; }
    public Guid VariantId { get; set; }
}

public sealed class ReadVariantRequestValidator : Validator<ReadVariantRequest>
{
    public ReadVariantRequestValidator()
    {
        RuleFor(x => x.MerchantId).NotEmpty().WithMessage("O identificador da organização é obrigatório.");
        RuleFor(x => x.ProductId).NotEmpty().WithMessage("O identificador do produto é obrigatório.");
        RuleFor(x => x.VariantId).NotEmpty().WithMessage("O identificador da variante é obrigatório.");
    }
}

public sealed class ReadVariantResponse : BaseResponse<VariantData>;
