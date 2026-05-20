using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api.Validators;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Merchants.Checkouts.ReadListCheckouts;

public sealed class ReadListCheckoutsRequest : IPaginatedRequest
{
    public Guid MerchantId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Search { get; set; }
    public CheckoutStatus? Status { get; set; }
    public CheckoutTemplateType? TemplateType { get; set; }
}

public sealed class ReadListCheckoutsRequestValidator : Validator<ReadListCheckoutsRequest>
{
    public ReadListCheckoutsRequestValidator()
    {
        RuleFor(x => x.MerchantId).NotEmpty().WithMessage("O identificador da organização é obrigatório.");
        RuleFor(x => x.Page).ValidPage();
        RuleFor(x => x.PageSize).ValidPageSize();
        RuleFor(x => x.Status).IsInEnum().When(x => x.Status.HasValue).WithMessage("O status é inválido.");
        RuleFor(x => x.TemplateType).IsInEnum().When(x => x.TemplateType.HasValue).WithMessage("O tipo de template é inválido.");
    }
}

public sealed class ReadListCheckoutsResponse : BaseResponse<Paginated<MinimalCheckout>>;
