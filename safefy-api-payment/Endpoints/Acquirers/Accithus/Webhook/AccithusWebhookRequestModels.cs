using System.Text.Json;
using System.Text.Json.Serialization;
using FastEndpoints;
using FluentValidation;
using safefy_api_payment.Endpoints.Models;

namespace safefy_api_payment.Endpoints.Acquirers.Accithus.Webhook;

public sealed class AccithusWebhookRequest
{
    [JsonPropertyName("event")]
    public string Event { get; set; } = string.Empty;

    [JsonPropertyName("data")]
    public JsonElement Data { get; set; }
}

public sealed class AccithusWebhookRequestValidator : Validator<AccithusWebhookRequest>
{
    public AccithusWebhookRequestValidator()
    {
        RuleFor(x => x.Event)
            .NotEmpty().WithMessage("O evento é obrigatório.");

        RuleFor(x => x.Data)
            .Must(d => d.ValueKind == JsonValueKind.Object).WithMessage("Os dados são obrigatórios.");
    }
}

public sealed class AccithusWebhookResponse : BaseResponse<AccithusWebhookData>;

public sealed class AccithusWebhookData
{
    public bool Processed { get; set; }
}
