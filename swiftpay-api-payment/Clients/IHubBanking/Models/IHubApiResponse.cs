using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Clients.IHubBanking.Models;

/// <summary>
/// Resposta genérica da API IHub Banking.
/// </summary>
public record IHubApiResponse<T>
{
    [JsonPropertyName("success")]
    public bool Success { get; init; }

    [JsonPropertyName("message")]
    public string? Message { get; init; }

    [JsonPropertyName("statusCode")]
    public int StatusCode { get; init; }

    [JsonPropertyName("data")]
    public T? Data { get; init; }
}

/// <summary>
/// Resposta de erro da API IHub Banking.
/// </summary>
public record IHubErrorResponse
{
    [JsonPropertyName("message")]
    public string? Message { get; init; }

    [JsonPropertyName("statusCode")]
    public int StatusCode { get; init; }

    [JsonPropertyName("error")]
    public string? Error { get; init; }
}
