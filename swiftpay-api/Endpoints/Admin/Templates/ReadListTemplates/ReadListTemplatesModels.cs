using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api.Validators;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Admin.Templates.ReadListTemplates;

public sealed class ReadListTemplatesRequest : IPaginatedRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public bool? IsActive { get; set; }
    
    /// <summary>
    /// Filtrar por templates gratuitos (true) ou com taxa (false)
    /// </summary>
    public bool? IsFree { get; set; }
    
    public CheckoutTemplateType? Type { get; set; }
    public string? Search { get; set; }
}

public sealed class ReadListTemplatesRequestValidator : Validator<ReadListTemplatesRequest>
{
    public ReadListTemplatesRequestValidator()
    {
        RuleFor(x => x.Page).ValidPage();
        RuleFor(x => x.PageSize).ValidPageSize();

        RuleFor(x => x.Type)
            .IsInEnum()
            .When(x => x.Type.HasValue)
            .WithMessage("Tipo de template inválido.");
    }
}

public sealed class ReadListTemplatesResponse : BaseResponse<Paginated<AdminMinimalTemplate>>;
