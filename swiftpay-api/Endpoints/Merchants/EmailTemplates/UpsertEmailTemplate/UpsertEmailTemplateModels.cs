using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Merchants.EmailTemplates.Shared.Models;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Merchants.EmailTemplates.UpsertEmailTemplate;

public sealed class UpsertEmailTemplateRequest
{
    public Guid MerchantId { get; set; }
    public MerchantEmailTemplateType Type { get; set; }
    public string? Name { get; set; }
    public bool? Enabled { get; set; }
    public string? Subject { get; set; }
    public List<EmailBlock>? Blocks { get; set; }
    public string? PrimaryColor { get; set; }
    public string? BackgroundColor { get; set; }
    public bool? IsDefault { get; set; }
    public string? ContainerBackgroundColor { get; set; }
    public string? TextColorMode { get; set; }
}

public sealed class UpsertEmailTemplateValidator : Validator<UpsertEmailTemplateRequest>
{
    public UpsertEmailTemplateValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.Type)
            .IsInEnum()
            .WithMessage("Tipo de template inválido.");

        RuleFor(x => x.Name)
            .MaximumLength(100)
            .When(x => x.Name != null)
            .WithMessage("O nome deve ter no máximo 100 caracteres.");

        RuleFor(x => x.Subject)
            .MaximumLength(200)
            .When(x => x.Subject != null)
            .WithMessage("O assunto deve ter no máximo 200 caracteres.");
    }
}

public sealed class UpsertEmailTemplateResponse : BaseResponse<EmailTemplateData>;
