using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api.Validators;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api.Endpoints.Merchants.Products.ReadListProducts;

public sealed class ReadListProductsRequest : IPaginatedRequest
{
    public Guid MerchantId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Search { get; set; }
    public ProductStatus? Status { get; set; }
    public ProductType? Type { get; set; }
    public Guid? CategoryId { get; set; }
}

public sealed class ReadListProductsRequestValidator : Validator<ReadListProductsRequest>
{
    public ReadListProductsRequestValidator()
    {
        RuleFor(x => x.MerchantId).NotEmpty().WithMessage("O identificador da organização é obrigatório.");
        RuleFor(x => x.Page).ValidPage();
        RuleFor(x => x.PageSize).ValidPageSize();
        RuleFor(x => x.Status).IsInEnum().When(x => x.Status.HasValue).WithMessage("O status é inválido.");
        RuleFor(x => x.Type).IsInEnum().When(x => x.Type.HasValue).WithMessage("O tipo é inválido.");
    }
}

public sealed class ReadListProductsResponse : BaseResponse<Paginated<MinimalProduct>>;
