using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Integrations;
using System.Text.Json.Serialization;

namespace safefy_api.Endpoints.Merchants.Integrations.UpdateIntegration;

public sealed class UpdateIntegrationRequest
{
    public Guid MerchantId { get; set; }
    public string Provider { get; set; } = string.Empty;
    public bool? Enabled { get; set; }
    public Dictionary<string, string>? ConfigValues { get; set; }
    public string? ApiToken { get; set; }
    public bool? WaitingPaymentEnabled { get; set; }
    public bool? PaidEnabled { get; set; }
    public bool? RefusedEnabled { get; set; }
    public bool? RefundedEnabled { get; set; }
    public bool? ChargedbackEnabled { get; set; }
}

public sealed class UpdateIntegrationRequestValidator : Validator<UpdateIntegrationRequest>
{
    public UpdateIntegrationRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty().WithMessage("O identificador da organizacao e obrigatorio.");

        RuleFor(x => x.Provider)
            .NotEmpty().WithMessage("O provider da integracao e obrigatorio.")
            .Must(provider =>
            {
                if (!Enum.TryParse<MerchantIntegrationProvider>(provider, true, out var parsedProvider))
                    return false;

                return MerchantIntegrationCatalog
                    .GetTrackingProviders()
                    .Contains(parsedProvider);
            })
            .WithMessage("Provider de integracao invalido.");
    }
}

public sealed class UpdateIntegrationResponse : BaseResponse<UpdateIntegrationData>;

public sealed class UpdateIntegrationData
{
    public string Provider { get; set; } = string.Empty;
    public bool IsEnabled { get; set; }
    public bool IsConfigured { get; set; }
    public Dictionary<string, string> ConfigValues { get; set; } = new(StringComparer.OrdinalIgnoreCase);
    public List<UpdateIntegrationConfigFieldData> ConfigFields { get; set; } = [];
    public bool WaitingPaymentEnabled { get; set; }
    public bool PaidEnabled { get; set; }
    public bool RefusedEnabled { get; set; }
    public bool RefundedEnabled { get; set; }
    public bool ChargedbackEnabled { get; set; }
}

public sealed class UpdateIntegrationConfigFieldData
{
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public MerchantIntegrationFieldType Type { get; set; }

    public bool IsRequired { get; set; }
    public string? Placeholder { get; set; }
    public string? Description { get; set; }
}
