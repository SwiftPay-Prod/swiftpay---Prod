using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api.Endpoints.Merchants.Products;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Merchants.Variants.UpdateVariant;

public sealed class UpdateVariantRequest
{
    public Guid MerchantId { get; set; }
    public Guid ProductId { get; set; }
    public Guid VariantId { get; set; }
    public string? ExternalId { get; set; }
    public string? Name { get; set; }
    public string? SKU { get; set; }
    public long? Price { get; set; }
    public int? StockQuantity { get; set; }
    public string? ImageUrl { get; set; }
    public VariantStatus? Status { get; set; }
}

public sealed class UpdateVariantRequestValidator : Validator<UpdateVariantRequest>
{
    public UpdateVariantRequestValidator()
    {
        RuleFor(x => x.MerchantId).NotEmpty().WithMessage("O identificador da organização é obrigatório.");
        RuleFor(x => x.ProductId).NotEmpty().WithMessage("O identificador do produto é obrigatório.");
        RuleFor(x => x.VariantId).NotEmpty().WithMessage("O identificador da variante é obrigatório.");
        RuleFor(x => x.Name).MaximumLength(200).When(x => x.Name != null).WithMessage("O nome deve ter no máximo 200 caracteres.");
        RuleFor(x => x.Price).GreaterThanOrEqualTo(0).When(x => x.Price.HasValue).WithMessage("O preço deve ser maior ou igual a zero.");
        RuleFor(x => x.ExternalId).MaximumLength(100).WithMessage("O ID externo deve ter no máximo 100 caracteres.");
        RuleFor(x => x.SKU).MaximumLength(100).WithMessage("O SKU deve ter no máximo 100 caracteres.");
        RuleFor(x => x.ImageUrl).MaximumLength(500).WithMessage("A URL da imagem deve ter no máximo 500 caracteres.");
        RuleFor(x => x.Status).IsInEnum().When(x => x.Status.HasValue).WithMessage("O status é inválido.");
        RuleFor(x => x.StockQuantity).GreaterThanOrEqualTo(0).When(x => x.StockQuantity.HasValue).WithMessage("A quantidade em estoque deve ser maior ou igual a zero.");
    }
}

public sealed class UpdateVariantResponse : BaseResponse<VariantData>;
