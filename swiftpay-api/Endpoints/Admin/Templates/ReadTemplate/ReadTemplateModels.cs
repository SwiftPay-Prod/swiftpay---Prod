using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Admin.Templates.ReadTemplate;

public sealed class ReadTemplateRequest
{
    public Guid TemplateId { get; set; }
}

public sealed class ReadTemplateRequestValidator : Validator<ReadTemplateRequest>
{
    public ReadTemplateRequestValidator()
    {
        RuleFor(x => x.TemplateId)
            .NotEmpty()
            .WithMessage("O identificador do template é obrigatório.");
    }
}

public sealed class ReadTemplateResponse : BaseResponse<AdminTemplateData>;
