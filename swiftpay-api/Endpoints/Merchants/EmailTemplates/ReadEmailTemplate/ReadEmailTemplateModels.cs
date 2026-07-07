using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Merchants.EmailTemplates.Shared.Models;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Merchants.EmailTemplates.ReadEmailTemplate;

public sealed class ReadEmailTemplateRequest
{
    public Guid MerchantId { get; set; }
    public MerchantEmailTemplateType Type { get; set; }
}

public sealed class ReadEmailTemplateValidator : Validator<ReadEmailTemplateRequest>
{
    public ReadEmailTemplateValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.Type)
            .IsInEnum()
            .WithMessage("Tipo de template inválido.");
    }
}

public sealed class ReadEmailTemplateResponse : BaseResponse<EmailTemplateData>;
