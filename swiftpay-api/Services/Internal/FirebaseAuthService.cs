using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using swiftpay_api.Interfaces;
using swiftpay_api_core.Models.Settings;

namespace swiftpay_api.Services.Internal;

/// <summary>
/// Verifies Firebase ID tokens without the Firebase Admin SDK.
/// Token signature is verified against Google's public certs (RS256, selected by the
/// <c>kid</c> header claim), with issuer/audience/expiry validation. Certs are cached
/// with a short TTL to bound requests and support key rotation.
/// </summary>
public sealed class FirebaseAuthService(
    IHttpClientFactory httpClientFactory,
    IOptions<FirebaseSettings> settings,
    ILogger<FirebaseAuthService> logger) : IFirebaseAuthService
{
    private static readonly Uri CertMetadataUri =
        new("https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com");

    private static readonly ConcurrentDictionary<string, CachedCerts> CertCache = new();

    private const int CertCacheTtlSeconds = 3600;

    public async Task<FirebaseTokenClaims?> VerifyIdTokenAsync(string idToken, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(idToken))
            return null;

        var projectId = settings.Value.ProjectId;
        if (string.IsNullOrWhiteSpace(projectId))
        {
            logger.LogWarning("Firebase verification skipped: FirebaseSettings:ProjectId is not configured.");
            return null;
        }

        try
        {
            // 1. Split JWT
            var parts = idToken.Split('.');
            if (parts.Length != 3)
            {
                logger.LogWarning("Firebase token malformed (not 3 segments).");
                return null;
            }

            var headerJson = DecodeSegment(parts[0]);
            var payloadJson = DecodeSegment(parts[1]);
            var signature = Base64UrlDecode(parts[2]);

            var header = JsonSerializer.Deserialize<JsonElement>(headerJson);
            var payload = JsonSerializer.Deserialize<JsonElement>(payloadJson);

            var kid = header.TryGetProperty("kid", out var kidEl) ? kidEl.GetString() : null;
            if (string.IsNullOrWhiteSpace(kid))
            {
                logger.LogWarning("Firebase token missing 'kid' header.");
                return null;
            }

            // 2. Fetch + cache public cert for this kid
            var (publicKey, issuer, audience) = await GetPublicKeyAsync(kid, ct);
            if (publicKey is null)
            {
                logger.LogWarning("Firebase token: no public cert found for kid '{Kid}'.", kid);
                return null;
            }

            // 3. Verify signature (RS256 = SHA-256, PKCS#1 v1.5)
            var signedData = Encoding.UTF8.GetBytes($"{parts[0]}.{parts[1]}");
            if (!publicKey.VerifyData(signedData, signature, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1))
            {
                logger.LogWarning("Firebase token signature verification failed for kid '{Kid}'.", kid);
                return null;
            }

            // 4. Extract claims
            if (!TryGetString(payload, "sub", out var uid)
                || string.IsNullOrWhiteSpace(uid)
                || !TryGetString(payload, "email", out var email)
                || string.IsNullOrWhiteSpace(email))
            {
                logger.LogWarning("Firebase token missing required 'sub'/'email' claims.");
                return null;
            }

            var emailVerified = TryGetBool(payload, "email_verified", out var ev) && ev;

            var signInProvider = "unknown";
            if (payload.TryGetProperty("firebase", out var firebaseEl)
                && firebaseEl.ValueKind == JsonValueKind.Object
                && firebaseEl.TryGetProperty("sign_in_provider", out var providerEl))
            {
                signInProvider = providerEl.GetString() ?? signInProvider;
            }

            // 5. Validate issuer + audience + expiry
            if (!TryGetString(payload, "iss", out var iss) || !string.Equals(iss, issuer, StringComparison.Ordinal))
            {
                logger.LogWarning("Firebase token issuer mismatch: expected '{Issuer}', got '{Actual}'.", issuer, iss);
                return null;
            }

            if (!TryGetString(payload, "aud", out var aud) || !string.Equals(aud, audience, StringComparison.Ordinal))
            {
                logger.LogWarning("Firebase token audience mismatch: expected '{Audience}', got '{Actual}'.", audience, aud);
                return null;
            }

            // exp is mandatory: a token with no expiry must never be accepted indefinitely.
            if (!payload.TryGetProperty("exp", out var expEl) || !expEl.TryGetInt64(out var exp))
            {
                logger.LogWarning("Firebase token missing 'exp' claim.");
                return null;
            }

            var expUtc = DateTimeOffset.FromUnixTimeSeconds(exp).UtcDateTime;
            if (expUtc <= DateTime.UtcNow.AddMinutes(-5))
            {
                logger.LogWarning("Firebase token expired.");
                return null;
            }

            return new FirebaseTokenClaims
            {
                Uid = uid,
                Email = email,
                EmailVerified = emailVerified,
                SignInProvider = signInProvider
            };
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Firebase token verification failed.");
            return null;
        }
    }

    /// <inheritdoc cref="FirebaseAuthService"/>
    private async Task<(RSA? PublicKey, string Issuer, string Audience)> GetPublicKeyAsync(string kid, CancellationToken ct)
    {
        var projectId = settings.Value.ProjectId;
        var issuer = $"https://securetoken.google.com/{projectId}";

        // Cache the whole cert set per project (bounded: one entry per project), not per
        // arbitrary kid — an attacker-supplied kid must not grow the cache unboundedly
        // or trigger a fresh Google fetch per unknown kid.
        if (CertCache.TryGetValue(projectId, out var cached) && !cached.IsExpired)
        {
            if (!cached.PublicKeys.TryGetValue(kid, out var hit) || hit is null)
                return (null, issuer, projectId);
            return (hit, issuer, projectId);
        }

        try
        {
            var client = httpClientFactory.CreateClient("FirebaseAuth");
            var response = await client.GetAsync(CertMetadataUri, ct);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync(ct);
            var certs = JsonSerializer.Deserialize<Dictionary<string, string>>(json);

            if (certs is null || certs.Count == 0)
                return (null, issuer, projectId);

            var keys = new Dictionary<string, RSA>(StringComparer.Ordinal);
            foreach (var (candidateKid, pem) in certs)
            {
                var imported = ImportRsaPublicKey(pem);
                if (imported is not null)
                    keys[candidateKid] = imported;
            }

            if (!keys.TryGetValue(kid, out var publicKey))
                return (null, issuer, projectId);

            CertCache[projectId] = new CachedCerts(keys, DateTime.UtcNow.AddSeconds(CertCacheTtlSeconds));
            return (publicKey, issuer, projectId);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to fetch Firebase public certificates.");
            return (null, issuer, projectId);
        }
    }

    private static RSA? ImportRsaPublicKey(string pem)
    {
        try
        {
            // Google cert metadata serves X.509 certificates. RSA.ImportFromPem does NOT
            // accept "BEGIN CERTIFICATE" blocks (only PUBLIC KEY / PRIVATE KEY), so the
            // public key must be extracted via X509Certificate2.GetRSAPublicKey().
            using var cert = X509Certificate2.CreateFromPem(pem);
            return cert.GetRSAPublicKey();
        }
        catch
        {
            return null;
        }
    }

    private static string DecodeSegment(string segment)
    {
        var bytes = Base64UrlDecode(segment);
        return Encoding.UTF8.GetString(bytes);
    }

    private static byte[] Base64UrlDecode(string segment)
    {
        var s = segment.Replace('-', '+').Replace('_', '/');
        switch (s.Length % 4)
        {
            case 2: s += "=="; break;
            case 3: s += "="; break;
        }
        return Convert.FromBase64String(s);
    }

    private static bool TryGetString(JsonElement el, string name, out string? value)
    {
        value = null;
        if (el.ValueKind != JsonValueKind.Object || !el.TryGetProperty(name, out var prop))
            return false;
        if (prop.ValueKind != JsonValueKind.String)
            return false;
        value = prop.GetString();
        return value is not null;
    }

    private static bool TryGetBool(JsonElement el, string name, out bool value)
    {
        value = false;
        if (el.ValueKind != JsonValueKind.Object || !el.TryGetProperty(name, out var prop))
            return false;
        if (prop.ValueKind != JsonValueKind.True && prop.ValueKind != JsonValueKind.False)
            return false;
        value = prop.ValueKind == JsonValueKind.True;
        return true;
    }

    private sealed record CachedCerts(Dictionary<string, RSA> PublicKeys, DateTime ExpiresAt)
    {
        public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    }
}