using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api.Endpoints.Merchants.Products.UpdateProduct;

public sealed class UpdateProductRequest
{
    public Guid MerchantId { get; set; }
    public Guid ProductId { get; set; }
    public string? ExternalId { get; set; }
    public string? Name { get; set; }
    public ProductType? Type { get; set; }
    public string? ImageUrl { get; set; }
    public List<string>? ImageUrls { get; set; }
    public string? Description { get; set; }
    public string? Brand { get; set; }
    public long? Price { get; set; }
    public int? StockQuantity { get; set; }
    public bool ClearStockQuantity { get; set; }
    public bool? IsUnlimitedDigitalStock { get; set; }
    public ProductStatus? Status { get; set; }
    public ICollection<Guid>? CategoryIds { get; set; }
    public ICollection<Guid>? CouponIds { get; set; }
}

public sealed class UpdateProductRequestValidator : Validator<UpdateProductRequest>
{
    public UpdateProductRequestValidator()
    {
        RuleFor(x => x.MerchantId).NotEmpty().WithMessage("O identificador da organização é obrigatório.");
        RuleFor(x => x.ProductId).NotEmpty().WithMessage("O identificador do produto é obrigatório.");
        RuleFor(x => x.Name).MaximumLength(200).When(x => x.Name != null).WithMessage("O nome deve ter no máximo 200 caracteres.");
        RuleFor(x => x.Type).IsInEnum().When(x => x.Type.HasValue).WithMessage("O tipo do produto é inválido.");
        RuleFor(x => x.Status).IsInEnum().When(x => x.Status.HasValue).WithMessage("O status do produto é inválido.");
        RuleFor(x => x.ExternalId).MaximumLength(100).WithMessage("O ID externo deve ter no máximo 100 caracteres.");
        RuleFor(x => x.Description).MaximumLength(2000).WithMessage("A descrição deve ter no máximo 2000 caracteres.");
        RuleFor(x => x.Brand).MaximumLength(100).WithMessage("A marca deve ter no máximo 100 caracteres.");
        RuleFor(x => x.ImageUrl).MaximumLength(500).WithMessage("A URL da imagem deve ter no máximo 500 caracteres.");
        RuleFor(x => x.ImageUrls)
            .Must(urls => urls == null || urls.Count <= 6)
            .WithMessage("É permitido no máximo 6 imagens por produto.");
        RuleForEach(x => x.ImageUrls)
            .MaximumLength(500)
            .WithMessage("Cada URL de imagem deve ter no máximo 500 caracteres.")
            .Must(url => Uri.TryCreate(url, UriKind.Absolute, out _))
            .WithMessage("A URL da imagem deve ser válida.");
        RuleFor(x => x.Price).GreaterThanOrEqualTo(0).When(x => x.Price.HasValue).WithMessage("O preço deve ser maior ou igual a zero.");
        RuleFor(x => x.StockQuantity).GreaterThanOrEqualTo(0).When(x => x.StockQuantity.HasValue).WithMessage("A quantidade em estoque deve ser maior ou igual a zero.");
    }
}

public sealed class UpdateProductResponse : BaseResponse<ProductData>;
