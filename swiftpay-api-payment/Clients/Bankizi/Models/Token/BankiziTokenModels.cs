using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Clients.Bankizi.Models.Token;

public record BankiziTokenResponse
{
    [JsonPropertyName("access_token")]
    public required string AccessToken { get; init; }

    [JsonPropertyName("expires_in")]
    public required int ExpiresIn { get; init; }

    [JsonPropertyName("token_type")]
    public string? TokenType { get; init; }
}
