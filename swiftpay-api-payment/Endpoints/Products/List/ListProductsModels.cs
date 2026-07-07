using FastEndpoints;
using FluentValidation;
using swiftpay_api_payment.Endpoints.Models;
using swiftpay_api_payment.Validators;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_payment.Endpoints.Products.List;

public class ListProductsRequest : IPaginatedRequest
{
    [QueryParam]
    public int Page { get; set; } = 1;

    [QueryParam]
    public int PageSize { get; set; } = 20;

    [QueryParam]
    public ProductStatus? Status { get; set; }

    [QueryParam]
    public ProductType? Type { get; set; }

    [QueryParam]
    public Guid? CategoryId { get; set; }

    [QueryParam]
    public string? Search { get; set; }

    [QueryParam]
    public string? ExternalId { get; set; }

    [QueryParam]
    public DateTime? StartDate { get; set; }

    [QueryParam]
    public DateTime? EndDate { get; set; }
}

public sealed class ListProductsRequestValidator : Validator<ListProductsRequest>
{
    public ListProductsRequestValidator()
    {
        RuleFor(x => x.Page).ValidPage();
        RuleFor(x => x.PageSize).ValidPageSize();

        RuleFor(x => x.Status)
            .IsInEnum()
            .When(x => x.Status.HasValue)
            .WithMessage("Status inválido. Use: Active, Inactive ou Archived.");

        RuleFor(x => x.Type)
            .IsInEnum()
            .When(x => x.Type.HasValue)
            .WithMessage("Tipo inválido. Use: Product ou Service.");

        RuleFor(x => x.EndDate)
            .GreaterThanOrEqualTo(x => x.StartDate)
            .When(x => x.StartDate.HasValue && x.EndDate.HasValue)
            .WithMessage("A data final deve ser maior ou igual à data inicial.");

        RuleFor(x => x.Search)
            .MaximumLength(255)
            .When(x => !string.IsNullOrEmpty(x.Search))
            .WithMessage("A busca deve ter no máximo 255 caracteres.");

        RuleFor(x => x.ExternalId)
            .MaximumLength(100)
            .When(x => !string.IsNullOrEmpty(x.ExternalId))
            .WithMessage("O external_id deve ter no máximo 100 caracteres.");
    }
}

public class ListProductsResponse : BaseResponse<PaginatedResponse<ProductData>> { }

public class ProductData
{
    public Guid Id { get; set; }
    public string? ExternalId { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public long? Price { get; set; }
    public string? ImageUrl { get; set; }
    public ProductType Type { get; set; }
    public ProductStatus Status { get; set; }
    public List<ProductCategoryData> Categories { get; set; } = [];
    public List<ProductVariantData> Variants { get; set; } = [];
    public DateTime CreatedAt { get; set; }
}

public class ProductCategoryData
{
    public Guid Id { get; set; }
    public string? ExternalId { get; set; }
    public string Name { get; set; } = null!;
    public CategoryStatus Status { get; set; }
}

public class ProductVariantData
{
    public Guid Id { get; set; }
    public string? ExternalId { get; set; }
    public string Name { get; set; } = null!;
    public string? SKU { get; set; }
    public long Price { get; set; }
    public int StockQuantity { get; set; }
    public string? ImageUrl { get; set; }
    public VariantStatus Status { get; set; }
}
