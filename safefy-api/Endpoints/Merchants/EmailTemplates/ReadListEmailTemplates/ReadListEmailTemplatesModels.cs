using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Merchants.EmailTemplates.Shared.Models;
using safefy_api.Endpoints.Models;
using safefy_api.Validators;
using safefy_api_core.Models.Enum;

namespace safefy_api.Endpoints.Merchants.EmailTemplates.ReadListEmailTemplates;

public sealed class ReadListEmailTemplatesRequest : IPaginatedRequest
{
    public Guid MerchantId { get; set; }

    [QueryParam]
    public MerchantEmailTemplateType? Type { get; set; }

    [QueryParam]
    public bool? Enabled { get; set; }

    [QueryParam]
    public string? Search { get; set; }

    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}

public sealed class ReadListEmailTemplatesValidator : Validator<ReadListEmailTemplatesRequest>
{
    public ReadListEmailTemplatesValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.Page).ValidPage();
        RuleFor(x => x.PageSize).ValidPageSize();
    }
}

public sealed class ReadListEmailTemplatesResponse : BaseResponse<Paginated<MinimalEmailTemplateData>>;
