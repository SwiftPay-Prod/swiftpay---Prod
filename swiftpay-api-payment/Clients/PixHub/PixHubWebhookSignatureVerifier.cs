using System.Security.Cryptography;
using System.Text;

namespace swiftpay_api_payment.Clients.PixHub;

public static class PixHubWebhookSignatureVerifier
{
    private static readonly TimeSpan Tolerance = TimeSpan.FromMinutes(5);
    private const long MaximumUnixTimestamp = 253_402_300_799;

    public static bool Verify(string payload, string? signatureHeader, string secret, DateTimeOffset now) =>
        Verify(Encoding.UTF8.GetBytes(payload), signatureHeader, secret, now);

    public static bool Verify(
        ReadOnlySpan<byte> payload,
        string? signatureHeader,
        string secret,
        DateTimeOffset now)
    {
        if (payload.IsEmpty ||
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

        var expectedHash = ComputeHash(payload, secret, timestamp);
        return CryptographicOperations.FixedTimeEquals(
            Encoding.ASCII.GetBytes(expectedHash),
            Encoding.ASCII.GetBytes(receivedHash));
    }

    public static string CreateSignature(string payload, string secret, long timestamp)
    {
        var hash = ComputeHash(Encoding.UTF8.GetBytes(payload), secret, timestamp);
        return $"t={timestamp},v1={hash}";
    }

    private static string ComputeHash(ReadOnlySpan<byte> payload, string secret, long timestamp)
    {
        var timestampBytes = Encoding.ASCII.GetBytes(timestamp.ToString(System.Globalization.CultureInfo.InvariantCulture));
        var signedPayload = new byte[timestampBytes.Length + 1 + payload.Length];
        timestampBytes.CopyTo(signedPayload, 0);
        signedPayload[timestampBytes.Length] = (byte)'.';
        payload.CopyTo(signedPayload.AsSpan(timestampBytes.Length + 1));

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        return Convert.ToHexString(hmac.ComputeHash(signedPayload)).ToLowerInvariant();
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

        return timestamp > 0 &&
               timestamp <= MaximumUnixTimestamp &&
               hash.Length == 64 &&
               hash.All(Uri.IsHexDigit);
    }
}
