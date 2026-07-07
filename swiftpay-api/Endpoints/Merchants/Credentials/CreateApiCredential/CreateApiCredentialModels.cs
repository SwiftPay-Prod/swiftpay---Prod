using System.Text.Json.Serialization;
using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Merchants.Credentials.CreateApiCredential;

public sealed class CreateApiCredentialRequest
{
    public Guid MerchantId { get; set; }

    public string? Name { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public ApiEnvironment Environment { get; set; } = ApiEnvironment.Production;

    public string? AllowedIpRange { get; set; }
}

public sealed class CreateApiCredentialRequestValidator : Validator<CreateApiCredentialRequest>
{
    public CreateApiCredentialRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty().WithMessage("O identificador da organização é obrigatório");

        RuleFor(x => x.Name)
            .MaximumLength(100).WithMessage("Name deve ter no máximo 100 caracteres");

        RuleFor(x => x.Environment)
            .IsInEnum().WithMessage("Environment inválido");

        RuleFor(x => x.AllowedIpRange)
            .MaximumLength(500).WithMessage("AllowedIpRange deve ter no máximo 500 caracteres");
    }
}

public sealed class CreateApiCredentialResponse : BaseResponse<ApiCredentialData>;

public sealed class ApiCredentialData
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string ClientId { get; set; } = null!;
    public string ClientSecret { get; set; } = null!;

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public ApiEnvironment Environment { get; set; }

    public string? AllowedIpRange { get; set; }
    public DateTime CreatedAt { get; set; }
}
