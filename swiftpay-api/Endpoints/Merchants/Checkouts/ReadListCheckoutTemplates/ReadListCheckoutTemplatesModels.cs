using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api.Validators;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Merchants.Checkouts.ReadListCheckoutTemplates;

public sealed class ReadListCheckoutTemplatesRequest : IPaginatedRequest
{
    public Guid MerchantId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public CheckoutTemplateType? Type { get; set; }
}

public sealed class ReadListCheckoutTemplatesRequestValidator : Validator<ReadListCheckoutTemplatesRequest>
{
    public ReadListCheckoutTemplatesRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.Page).ValidPage();
        RuleFor(x => x.PageSize).ValidPageSize();
    }
}

public sealed class ReadListCheckoutTemplatesResponse : BaseResponse<Paginated<CheckoutTemplateData>>;
