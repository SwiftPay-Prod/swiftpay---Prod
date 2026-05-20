namespace safefy_api_payment.Interfaces.Internal;

public interface ITokenService
{
    string GenerateAccessToken(Guid merchantId, Guid credentialId, string environment, int secretVersion);
    TokenData? ValidateToken(string token);
}

public record TokenData
{
    public Guid MerchantId { get; init; }
    public Guid CredentialId { get; init; }
    public string Environment { get; init; } = null!;
    public int SecretVersion { get; init; }
    public DateTime ExpiresAt { get; init; }
}
