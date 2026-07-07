using System.Security.Cryptography;
using System.Text;

namespace swiftpay_api_core.Utils;

public static class CryptoUtils
{
    private const int WebhookSecretBytes = 32;
    private const int TokenBytes = 32;
    private const int ApiCredentialBytes = 24;
    private const string ShortIdCharset = "abcdefghijklmnopqrstuvwxyz0123456789";

    public static string GenerateToken()
    {
        var randomBytes = new byte[TokenBytes];
        RandomNumberGenerator.Fill(randomBytes);
        return Convert.ToBase64String(randomBytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .TrimEnd('=');
    }

    public static string GenerateCode()
    {
        return RandomNumberGenerator.GetInt32(100000, 999999).ToString();
    }

    /// <summary>
    /// Generates a unique short identifier using lowercase letters and numbers.
    /// Default length of 10 characters provides ~10^15 combinations.
    /// </summary>
    public static string GenerateShortId(int length = 10)
    {
        var chars = new char[length];
        for (int i = 0; i < length; i++)
        {
            chars[i] = ShortIdCharset[RandomNumberGenerator.GetInt32(ShortIdCharset.Length)];
        }
        return new string(chars);
    }

    public static string GenerateSecurePassword(int length = 16)
    {
        const string upperChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const string lowerChars = "abcdefghijklmnopqrstuvwxyz";
        const string numberChars = "0123456789";
        const string specialChars = "!@#$%^&*()-_=+";

        var password = new char[length];

        password[0] = upperChars[RandomNumberGenerator.GetInt32(upperChars.Length)];
        password[1] = lowerChars[RandomNumberGenerator.GetInt32(lowerChars.Length)];
        password[2] = numberChars[RandomNumberGenerator.GetInt32(numberChars.Length)];
        password[3] = specialChars[RandomNumberGenerator.GetInt32(specialChars.Length)];

        const string allChars = upperChars + lowerChars + numberChars + specialChars;
        for (int i = 4; i < length; i++)
        {
            password[i] = allChars[RandomNumberGenerator.GetInt32(allChars.Length)];
        }

        return new string(password.OrderBy(_ => RandomNumberGenerator.GetInt32(int.MaxValue)).ToArray());
    }

    public static string ComputeSha256Hash(string input)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input));
        return Convert.ToBase64String(bytes);
    }

    public static (string ClientId, string ClientSecret, string ClientSecretHash) GenerateApiCredentials(string environment)
    {
        var randomBytes = new byte[ApiCredentialBytes];
        RandomNumberGenerator.Fill(randomBytes);
        var suffix = Convert.ToHexString(randomBytes).ToLower();
        
        var clientId = $"pk_{environment.ToLower()}_{suffix}";
        var clientSecret = GenerateSecureApiSecret(environment);
        var clientSecretHash = ComputeSha256Hash(clientSecret);

        return (clientId, clientSecret, clientSecretHash);
    }

    public static string GenerateSecureApiSecret(string environment)
    {
        var randomBytes = new byte[TokenBytes];
        RandomNumberGenerator.Fill(randomBytes);
        var suffix = Convert.ToHexString(randomBytes).ToLower();
        return $"sk_{environment.ToLower()}_{suffix}";
    }

    public static string GenerateWebhookSecret()
    {
        var randomBytes = new byte[WebhookSecretBytes];
        RandomNumberGenerator.Fill(randomBytes);
        var secret = Convert.ToHexString(randomBytes).ToLower();
        return $"whsec_{secret}";
    }

    public static string GenerateAcquirerWebhookToken()
    {
        var randomBytes = new byte[WebhookSecretBytes];
        RandomNumberGenerator.Fill(randomBytes);
        return Convert.ToHexString(randomBytes).ToLower();
    }

    public static string ComputeHmacSha256(string payload, string secret)
    {
        var keyBytes = Encoding.UTF8.GetBytes(secret);
        var payloadBytes = Encoding.UTF8.GetBytes(payload);

        var hashBytes = HMACSHA256.HashData(keyBytes, payloadBytes);
        return Convert.ToHexString(hashBytes).ToLower();
    }

    public static string ComputeHmacSha256WithTimestamp(string payload, string secret, long timestamp)
    {
        var signedPayload = $"{timestamp}.{payload}";
        return ComputeHmacSha256(signedPayload, secret);
    }

    public static bool ValidateHmacSignature(string payload, string signature, string secret)
    {
        var expectedSignature = ComputeHmacSha256(payload, secret);
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(signature),
            Encoding.UTF8.GetBytes(expectedSignature));
    }

    public static bool ValidateHmacSignatureWithPrefix(string payload, string signature, string secret, string prefix = "sha256=")
    {
        var expectedSignature = $"{prefix}{ComputeHmacSha256(payload, secret)}";
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(signature),
            Encoding.UTF8.GetBytes(expectedSignature));
    }

    public static bool ValidateTimedSignature(
        string payload,
        string signature,
        string secret,
        long timestamp,
        int toleranceSeconds = 300)
    {
        var currentTimestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        if (Math.Abs(currentTimestamp - timestamp) > toleranceSeconds)
        {
            return false;
        }

        var expectedSignature = ComputeHmacSha256WithTimestamp(payload, secret, timestamp);
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(signature),
            Encoding.UTF8.GetBytes(expectedSignature));
    }

    public static bool ConstantTimeEquals(string a, string b)
    {
        if (a == null || b == null)
            return false;
            
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(a),
            Encoding.UTF8.GetBytes(b));
    }
}
