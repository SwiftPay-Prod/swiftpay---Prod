using System.Text.Json.Serialization;

namespace swiftpay_api.Models.Auth;

public class JWTDecode
{
    [JsonPropertyName("iss")]
    public required string Issuer { get; set; }
    [JsonPropertyName("aud")]
    public required string Audience { get; set; }
    [JsonPropertyName("exp")]
    public required int Expiration { get; set; }
    [JsonPropertyName("sub")]
    public required string Subject { get; set; }
    [JsonPropertyName("given_name")]
    public required string GivenName { get; set; }
    [JsonPropertyName("email")]
    public required string Email { get; set; }
    [JsonPropertyName("roles")]
    public required string Role { get; set; }
}
