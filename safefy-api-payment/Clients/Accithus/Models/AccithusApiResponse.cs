using System.Text.Json.Serialization;

namespace safefy_api_payment.Clients.Accithus.Models;

public sealed record AccithusApiResponse<T>
{
    [JsonPropertyName("success")]
    public bool Success { get; init; }

    [JsonPropertyName("message")]
    public string? Message { get; init; }

    [JsonPropertyName("data")]
    public T? Data { get; init; }

    [JsonPropertyName("error")]
    public AccithusErrorDetail? Error { get; init; }
}

public sealed record AccithusErrorDetail
{
    [JsonPropertyName("code")]
    public string? Code { get; init; }

    [JsonPropertyName("message")]
    public string? Message { get; init; }
}
