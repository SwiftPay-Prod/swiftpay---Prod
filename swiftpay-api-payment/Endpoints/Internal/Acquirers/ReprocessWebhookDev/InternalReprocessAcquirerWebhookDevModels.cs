using FastEndpoints;
using FluentValidation;
using safefy_api_core.Models.Database;
using System.Text.Json.Serialization;

namespace safefy_api_payment.Endpoints.Internal.Acquirers.ReprocessWebhookDev;

public sealed class InternalReprocessAcquirerWebhookDevRequest
{
    public Guid WebhookLogId { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public AcquirerType? AcquirerType { get; set; }
    public string? PayloadJson { get; set; }
}

public sealed class InternalReprocessAcquirerWebhookDevRequestValidator : Validator<InternalReprocessAcquirerWebhookDevRequest>
{
    public InternalReprocessAcquirerWebhookDevRequestValidator()
    {
        RuleFor(x => x)
            .Must(HasWebhookLogIdOrPayloadMode)
            .WithMessage("Informe um webhookLogId valido ou acquirerType + payloadJson para reprocessamento.");

        RuleFor(x => x.AcquirerType)
            .IsInEnum()
            .When(x => !string.IsNullOrWhiteSpace(x.PayloadJson))
            .WithMessage("Tipo de adquirente invalido.");

        RuleFor(x => x.PayloadJson)
            .Must(BeValidJsonObject)
            .When(x => !string.IsNullOrWhiteSpace(x.PayloadJson))
            .WithMessage("O payload deve ser um JSON de objeto valido.");
    }

    private static bool HasWebhookLogIdOrPayloadMode(InternalReprocessAcquirerWebhookDevRequest request)
    {
        if (request.WebhookLogId != Guid.Empty)
            return true;

        return request.AcquirerType.HasValue && !string.IsNullOrWhiteSpace(request.PayloadJson);
    }

    private static bool BeValidJsonObject(string? payloadJson)
    {
        if (string.IsNullOrWhiteSpace(payloadJson))
            return false;

        try
        {
            using var json = System.Text.Json.JsonDocument.Parse(payloadJson);
            return json.RootElement.ValueKind == System.Text.Json.JsonValueKind.Object;
        }
        catch
        {
            return false;
        }
    }
}

public sealed class InternalReprocessAcquirerWebhookDevResponse
{
    public bool Success { get; set; }
    public Guid WebhookLogId { get; set; }
    public string? AcquirerType { get; set; }
    public Guid? PaymentId { get; set; }
    public Guid? PayoutId { get; set; }
    public string? Status { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
}
