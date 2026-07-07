using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api.Endpoints.Merchants.Products;
using swiftpay_api.Validators;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Merchants.Categories.ReadListCategories;

public sealed class ReadListCategoriesRequest : IPaginatedRequest
{
    public Guid MerchantId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Search { get; set; }
    public CategoryStatus? Status { get; set; }
}

public sealed class ReadListCategoriesRequestValidator : Validator<ReadListCategoriesRequest>
{
    public ReadListCategoriesRequestValidator()
    {
        RuleFor(x => x.MerchantId).NotEmpty().WithMessage("O identificador da organização é obrigatório.");
        RuleFor(x => x.Page).ValidPage();
        RuleFor(x => x.PageSize).ValidPageSize();
        RuleFor(x => x.Status).IsInEnum().When(x => x.Status.HasValue).WithMessage("O status é inválido.");
    }
}

public sealed class ReadListCategoriesResponse : BaseResponse<Paginated<MinimalCategory>>;
