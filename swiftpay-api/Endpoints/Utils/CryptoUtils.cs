namespace swiftpay_api.Endpoints.Utils;

public static class CryptoUtils
{
    public static string GenerateToken() => swiftpay_api_core.Utils.CryptoUtils.GenerateToken();
    
    public static string GenerateCode() => swiftpay_api_core.Utils.CryptoUtils.GenerateCode();
    
    public static string GenerateSecurePassword(int length = 16) => swiftpay_api_core.Utils.CryptoUtils.GenerateSecurePassword(length);
    
    public static string ComputeSha256Hash(string input) => swiftpay_api_core.Utils.CryptoUtils.ComputeSha256Hash(input);
    
    public static (string ClientId, string ClientSecret, string ClientSecretHash) GenerateApiCredentials(string environment) 
        => swiftpay_api_core.Utils.CryptoUtils.GenerateApiCredentials(environment);
    
    public static string GenerateWebhookSecret() => swiftpay_api_core.Utils.CryptoUtils.GenerateWebhookSecret();
    
    public static string ComputeHmacSha256(string payload, string secret) 
        => swiftpay_api_core.Utils.CryptoUtils.ComputeHmacSha256(payload, secret);
}
