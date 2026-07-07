using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Clients.Bankizi.Models;

public record BankiziApiResponse<T>
{
    [JsonPropertyName("code")]
    public int Code { get; init; }

    [JsonPropertyName("success")]
    public bool Success { get; init; }

    [JsonPropertyName("message")]
    public string? Message { get; init; }

    [JsonPropertyName("data")]
    public T? Data { get; init; }
}
