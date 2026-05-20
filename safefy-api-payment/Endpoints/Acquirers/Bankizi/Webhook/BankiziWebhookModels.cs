using System.Text.Json;
using System.Text.Json.Serialization;
using FastEndpoints;
using FluentValidation;
using safefy_api_payment.Endpoints.Models;

namespace safefy_api_payment.Endpoints.Acquirers.Bankizi.Webhook;

/// <summary>
/// Request genérico do webhook da Bankizi.
/// Aceita tanto PIX_IN quanto PIX_OUT.
/// </summary>
public sealed class BankiziWebhookRequest
{
    [JsonPropertyName("event")]
    public string Event { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string? Type { get; set; }

    [JsonPropertyName("data")]
    public JsonElement Data { get; set; }
}

/// <summary>
/// Validador do request do webhook da Bankizi.
/// </summary>
public sealed class BankiziWebhookRequestValidator : Validator<BankiziWebhookRequest>
{
    public BankiziWebhookRequestValidator()
    {
        RuleFor(x => x.Event)
            .NotEmpty().WithMessage("O evento é obrigatório.")
            .Must(e => e is "PIX_IN" or "PIX_OUT").WithMessage("Evento deve ser PIX_IN ou PIX_OUT.");

        RuleFor(x => x.Data)
            .Must(d => d.ValueKind == JsonValueKind.Object).WithMessage("Os dados são obrigatórios.");
    }
}

public sealed class BankiziWebhookResponse : BaseResponse<BankiziWebhookData> { }

public sealed class BankiziWebhookData
{
    public bool Processed { get; set; }
}
