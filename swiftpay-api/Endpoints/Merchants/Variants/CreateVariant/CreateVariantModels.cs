using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api.Endpoints.Merchants.Products;

namespace safefy_api.Endpoints.Merchants.Variants.CreateVariant;

public sealed class CreateVariantRequest
{
    public Guid MerchantId { get; set; }
    public Guid ProductId { get; set; }
    public string? ExternalId { get; set; }
    public string Name { get; set; } = null!;
    public string? SKU { get; set; }
    public long Price { get; set; }
    public int? StockQuantity { get; set; }
    public string? ImageUrl { get; set; }
}

public sealed class CreateVariantRequestValidator : Validator<CreateVariantRequest>
{
    public CreateVariantRequestValidator()
    {
        RuleFor(x => x.MerchantId).NotEmpty().WithMessage("O identificador da organização é obrigatório.");
        RuleFor(x => x.ProductId).NotEmpty().WithMessage("O identificador do produto é obrigatório.");
        RuleFor(x => x.Name).NotEmpty().WithMessage("O nome da variante é obrigatório.")
            .MaximumLength(200).WithMessage("O nome deve ter no máximo 200 caracteres.");
        RuleFor(x => x.Price).GreaterThanOrEqualTo(0).WithMessage("O preço deve ser maior ou igual a zero.");
        RuleFor(x => x.ExternalId).MaximumLength(100).WithMessage("O ID externo deve ter no máximo 100 caracteres.");
        RuleFor(x => x.SKU).MaximumLength(100).WithMessage("O SKU deve ter no máximo 100 caracteres.");
        RuleFor(x => x.ImageUrl).MaximumLength(500).WithMessage("A URL da imagem deve ter no máximo 500 caracteres.");
        RuleFor(x => x.StockQuantity).GreaterThanOrEqualTo(0).When(x => x.StockQuantity.HasValue).WithMessage("A quantidade em estoque deve ser maior ou igual a zero.");
    }
}

public sealed class CreateVariantResponse : BaseResponse<VariantData>;
