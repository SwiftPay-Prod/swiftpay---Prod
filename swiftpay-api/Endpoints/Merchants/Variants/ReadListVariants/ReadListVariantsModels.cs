using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api.Endpoints.Merchants.Products;
using swiftpay_api.Validators;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Merchants.Variants.ReadListVariants;

public sealed class ReadListVariantsRequest : IPaginatedRequest
{
    public Guid MerchantId { get; set; }
    public Guid ProductId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Search { get; set; }
    public VariantStatus? Status { get; set; }
}

public sealed class ReadListVariantsRequestValidator : Validator<ReadListVariantsRequest>
{
    public ReadListVariantsRequestValidator()
    {
        RuleFor(x => x.MerchantId).NotEmpty().WithMessage("O identificador da organização é obrigatório.");
        RuleFor(x => x.ProductId).NotEmpty().WithMessage("O identificador do produto é obrigatório.");
        RuleFor(x => x.Page).ValidPage();
        RuleFor(x => x.PageSize).ValidPageSize();
        RuleFor(x => x.Status).IsInEnum().When(x => x.Status.HasValue).WithMessage("O status é inválido.");
    }
}

public sealed class ReadListVariantsResponse : BaseResponse<Paginated<MinimalVariant>>;
