using System.Text.Json.Serialization;
using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Merchants.Credentials.ConfirmRegenerateApiCredential;

public sealed class ConfirmRegenerateApiCredentialRequest
{
    public Guid MerchantId { get; set; }
    public Guid CredentialId { get; set; }
    public string Code { get; set; } = null!;
}

public sealed class ConfirmRegenerateApiCredentialRequestValidator : Validator<ConfirmRegenerateApiCredentialRequest>
{
    public ConfirmRegenerateApiCredentialRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty().WithMessage("O identificador da organização é obrigatório");

        RuleFor(x => x.CredentialId)
            .NotEmpty().WithMessage("O identificador da credencial é obrigatório");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("O código de confirmação é obrigatório")
            .Length(6).WithMessage("O código deve ter 6 dígitos");
    }
}

public sealed class ConfirmRegenerateApiCredentialResponse : BaseResponse<ConfirmRegenerateApiCredentialData>;

public sealed class ConfirmRegenerateApiCredentialData
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string ClientId { get; set; } = null!;
    public string ClientSecret { get; set; } = null!;

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public ApiEnvironment Environment { get; set; }

    public string? AllowedIpRange { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
