using System.Text.Json.Serialization;
using swiftpay_api_payment.Clients.HunterPay.Models.Transactions;
using swiftpay_api_payment.Clients.HunterPay.Models.Withdrawals;
using swiftpay_api_payment.Endpoints.Models;

namespace swiftpay_api_payment.Clients.HunterPay.Models.Webhook;

public sealed class HunterPayWebhookResponse : BaseResponse<HunterPayWebhookData>;

public sealed class HunterPayWebhookRequest
{
    [JsonPropertyName("id")]
    public string? Id { get; init; }

    [JsonPropertyName("event")]
    public HunterPayWebhookEventType? Event { get; init; }

    [JsonPropertyName("type")]
    public HunterPayWebhookType? Type { get; init; }

    [JsonPropertyName("objectId")]
    public string? ObjectId { get; init; }

    [JsonPropertyName("data")]
    public HunterPayTransactionData? Data { get; init; }

    [JsonPropertyName("withdrawal")]
    public HunterPayWithdrawal? Withdrawal { get; init; }

    [JsonPropertyName("timestamp")]
    public string? TimestampRaw { get; init; }
}

public sealed class HunterPayWebhookData
{
    public bool Processed { get; set; }
}
