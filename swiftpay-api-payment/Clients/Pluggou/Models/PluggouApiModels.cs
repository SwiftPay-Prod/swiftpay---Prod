using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Clients.Pluggou.Models;

public sealed class PluggouApiResponse<T>
{
    [JsonPropertyName("success")]
    public bool Success { get; init; }

    [JsonPropertyName("message")]
    public string? Message { get; init; }

    [JsonPropertyName("data")]
    public T? Data { get; init; }

    [JsonPropertyName("error")]
    public string? Error { get; init; }
}
