using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Endpoints.Acquirers.FlevoPay.Webhook;

public class FlevoPayWebhookResponse
{
    [JsonPropertyName("received")]
    public bool Received { get; set; } = true;
}