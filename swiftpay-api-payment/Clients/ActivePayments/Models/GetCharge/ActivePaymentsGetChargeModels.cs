using System.Text.Json.Serialization;
using swiftpay_api_payment.Clients.ActivePayments.Models.CreateCharge;

namespace swiftpay_api_payment.Clients.ActivePayments.Models.GetCharge;

public sealed class ActivePaymentsGetChargeResponse
{
    [JsonPropertyName("chargeId")]
    public string? ChargeId { get; init; }

    [JsonPropertyName("externalId")]
    public string? ExternalId { get; init; }

    [JsonPropertyName("amount")]
    public string? Amount { get; init; }

    [JsonPropertyName("netAmount")]
    public string? NetAmount { get; init; }

    [JsonPropertyName("fee")]
    public string? Fee { get; init; }

    [JsonPropertyName("status")]
    public ActivePaymentsChargeStatus? Status { get; init; }

    [JsonPropertyName("method")]
    public ActivePaymentsPaymentMethod? Method { get; init; }

    [JsonPropertyName("customer")]
    public ActivePaymentsCustomerData? Customer { get; init; }

    [JsonPropertyName("createdAt")]
    public DateTime? CreatedAt { get; init; }

    [JsonPropertyName("paidAt")]
    public DateTime? PaidAt { get; init; }
}

public sealed class ActivePaymentsCustomerData
{
    [JsonPropertyName("name")]
    public string? Name { get; init; }

    [JsonPropertyName("cpf")]
    public string? Cpf { get; init; }

    [JsonPropertyName("email")]
    public string? Email { get; init; }
}
