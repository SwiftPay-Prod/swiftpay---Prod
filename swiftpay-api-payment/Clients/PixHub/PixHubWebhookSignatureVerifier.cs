using System.Security.Cryptography;
using System.Text;

namespace swiftpay_api_payment.Clients.PixHub;

public static class PixHubWebhookSignatureVerifier
{
    private static readonly TimeSpan Tolerance = TimeSpan.FromMinutes(5);

    public static bool Verify(
        string payload,
        string? signatureHeader,
        string secret,
        DateTimeOffset now)
    {
        if (string.IsNullOrWhiteSpace(payload) ||
            string.IsNullOrWhiteSpace(signatureHeader) ||
            string.IsNullOrWhiteSpace(secret) ||
            !TryParseHeader(signatureHeader, out var timestamp, out var receivedHash))
        {
            return false;
        }

        var signedAt = DateTimeOffset.FromUnixTimeSeconds(timestamp);
        if ((now - signedAt).Duration() > Tolerance)
        {
            return false;
        }

        var expectedHeader = CreateSignature(payload, secret, timestamp);
        var expectedHash = expectedHeader[(expectedHeader.IndexOf("v1=", StringComparison.Ordinal) + 3)..];

        return CryptographicOperations.FixedTimeEquals(
            Encoding.ASCII.GetBytes(expectedHash),
            Encoding.ASCII.GetBytes(receivedHash));
    }

    public static string CreateSignature(string payload, string secret, long timestamp)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var data = Encoding.UTF8.GetBytes($"{timestamp}.{payload}");
        var hash = Convert.ToHexString(hmac.ComputeHash(data)).ToLowerInvariant();
        return $"t={timestamp},v1={hash}";
    }

    private static bool TryParseHeader(string header, out long timestamp, out string hash)
    {
        timestamp = 0;
        hash = string.Empty;

        foreach (var part in header.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries))
        {
            if (part.StartsWith("t=", StringComparison.Ordinal))
            {
                _ = long.TryParse(part.AsSpan(2), out timestamp);
            }
            else if (part.StartsWith("v1=", StringComparison.Ordinal))
            {
                hash = part[3..];
            }
        }

        return timestamp > 0 && hash.Length == 64 && hash.All(Uri.IsHexDigit);
    }
}
