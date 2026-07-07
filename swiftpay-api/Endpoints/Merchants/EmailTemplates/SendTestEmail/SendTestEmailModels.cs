using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Merchants.EmailTemplates.SendTestEmail;

public sealed class SendTestEmailRequest
{
    public Guid MerchantId { get; set; }
    public MerchantEmailTemplateType Type { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public List<EmailBlock>? Blocks { get; set; }
    public string? PrimaryColor { get; set; }
    public string? BackgroundColor { get; set; }
    public string? ContainerBackgroundColor { get; set; }
    public string? TextColor { get; set; }
    public string? MutedColor { get; set; }
}

public sealed class SendTestEmailValidator : Validator<SendTestEmailRequest>
{
    public SendTestEmailValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.Type)
            .IsInEnum()
            .WithMessage("Tipo de template inválido.");

        RuleFor(x => x.Email)
            .NotEmpty()
            .WithMessage("O email de destino é obrigatório.")
            .EmailAddress()
            .WithMessage("O email de destino deve ser válido.");

        RuleFor(x => x.Subject)
            .NotEmpty()
            .WithMessage("O assunto do email é obrigatório.")
            .MaximumLength(200)
            .WithMessage("O assunto deve ter no máximo 200 caracteres.");
    }
}

public sealed class SendTestEmailResponse : BaseResponse;
