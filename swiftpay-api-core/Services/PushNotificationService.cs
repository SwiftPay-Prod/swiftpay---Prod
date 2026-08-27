using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Settings;

namespace swiftpay_api_core.Services;

public class PushNotificationService : IPushNotificationService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<PushNotificationService> _logger;
    private readonly FirebaseSettings _settings;
    private readonly HttpClient _httpClient;
    private string? _accessToken;
    private DateTime _tokenExpiry = DateTime.MinValue;
    private readonly SemaphoreSlim _tokenLock = new(1, 1);

    public PushNotificationService(
        IServiceScopeFactory scopeFactory,
        ILogger<PushNotificationService> logger,
        IOptions<FirebaseSettings> settings,
        HttpClient httpClient)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _settings = settings.Value;
        _httpClient = httpClient;
    }

    public async Task SendPushNotificationAsync(Guid userId, string title, string body, Dictionary<string, string>? data = null)
    {
        if (!_settings.Enabled)
        {
            return;
        }

        try
        {
            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();

            var tokens = await dbContext.PushTokens
                .Where(pt => pt.UserId == userId && pt.IsActive)
                .Select(pt => pt.Token)
                .ToListAsync();

            if (tokens.Count == 0)
            {
                return;
            }

            var accessToken = await GetAccessTokenAsync();
            if (string.IsNullOrEmpty(accessToken))
            {
                _logger.LogError("Failed to get Firebase access token for push notification");
                return;
            }

            foreach (var token in tokens)
            {
                await SendToTokenAsync(token, title, body, data, accessToken);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending push notification to user {UserId}", userId);
        }
    }

    public async Task SendPushNotificationToMerchantUsersAsync(Guid merchantId, string title, string body, Dictionary<string, string>? data = null)
    {
        if (!_settings.Enabled)
        {
            return;
        }

        try
        {
            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();

            var userIds = await dbContext.Merchants
                .Where(m => m.Id == merchantId)
                .Select(m => m.UserId)
                .ToListAsync();

            foreach (var userId in userIds)
            {
                await SendPushNotificationAsync(userId, title, body, data);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending push notification to merchant {MerchantId} users", merchantId);
        }
    }

    public async Task<PushToken?> RegisterTokenAsync(Guid userId, string token, PushTokenPlatform platform, string? deviceName = null, string? deviceId = null)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();

            var existingToken = await dbContext.PushTokens
                .Where(pt => pt.Token == token)
                .OrderBy(pt => pt.Id)
                .FirstOrDefaultAsync();

            if (existingToken != null)
            {
                existingToken.UserId = userId;
                existingToken.Platform = platform;
                existingToken.DeviceName = deviceName;
                existingToken.DeviceId = deviceId;
                existingToken.IsActive = true;
                existingToken.LastUsedAt = DateTime.UtcNow;
                
                await dbContext.SaveChangesAsync();
                return existingToken;
            }

            var pushToken = new PushToken
            {
                Id = Guid.CreateVersion7(),
                UserId = userId,
                Token = token,
                Platform = platform,
                DeviceName = deviceName,
                DeviceId = deviceId,
                IsActive = true,
                LastUsedAt = DateTime.UtcNow
            };

            dbContext.PushTokens.Add(pushToken);
            await dbContext.SaveChangesAsync();

            return pushToken;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error registering push token for user {UserId}", userId);
            return null;
        }
    }

    public async Task<bool> UnregisterTokenAsync(Guid userId, string token)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();

            var pushToken = await dbContext.PushTokens
                .Where(pt => pt.UserId == userId && pt.Token == token)
                .OrderBy(pt => pt.Id)
                .FirstOrDefaultAsync();

            if (pushToken == null)
            {
                return false;
            }

            dbContext.PushTokens.Remove(pushToken);
            await dbContext.SaveChangesAsync();

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unregistering push token for user {UserId}", userId);
            return false;
        }
    }

    public async Task<bool> UnregisterTokensByDeviceIdAsync(Guid userId, string deviceId)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();

            var tokens = await dbContext.PushTokens
                .Where(pt => pt.UserId == userId && pt.DeviceId == deviceId)
                .ToListAsync();

            if (tokens.Count == 0)
            {
                return true;
            }

            dbContext.PushTokens.RemoveRange(tokens);
            await dbContext.SaveChangesAsync();

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unregistering push tokens for user {UserId} device {DeviceId}", userId, deviceId);
            return false;
        }
    }

    public async Task<bool> UnregisterAllTokensAsync(Guid userId)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();

            var tokens = await dbContext.PushTokens
                .Where(pt => pt.UserId == userId)
                .ToListAsync();

            if (tokens.Count == 0)
            {
                return true;
            }

            dbContext.PushTokens.RemoveRange(tokens);
            await dbContext.SaveChangesAsync();

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unregistering all push tokens for user {UserId}", userId);
            return false;
        }
    }

    public async Task<List<PushToken>> GetUserTokensAsync(Guid userId)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();

            return await dbContext.PushTokens
                .Where(pt => pt.UserId == userId && pt.IsActive)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting push tokens for user {UserId}", userId);
            return [];
        }
    }

    private async Task SendToTokenAsync(string token, string title, string body, Dictionary<string, string>? data, string accessToken)
    {
        try
        {
            var messageData = data ?? [];
            messageData["title"] = title;
            messageData["body"] = body;

            var message = new
            {
                message = new
                {
                    token,
                    data = messageData,
                    webpush = new
                    {
                        fcm_options = new
                        {
                            link = data?.GetValueOrDefault("actionUrl") ?? "/panel/dashboard"
                        }
                    }
                }
            };

            var json = JsonSerializer.Serialize(message, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            var request = new HttpRequestMessage(HttpMethod.Post, $"https://fcm.googleapis.com/v1/projects/{_settings.ProjectId}/messages:send");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("FCM send failed: {StatusCode} - {Error}", response.StatusCode, errorContent);

                if (response.StatusCode == System.Net.HttpStatusCode.NotFound ||
                    errorContent.Contains("UNREGISTERED") ||
                    errorContent.Contains("INVALID_ARGUMENT"))
                {
                    await InvalidateTokenAsync(token);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending FCM message to token");
        }
    }

    private async Task InvalidateTokenAsync(string token)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();

            var pushToken = await dbContext.PushTokens
                .Where(pt => pt.Token == token)
                .OrderBy(pt => pt.Id)
                .FirstOrDefaultAsync();

            if (pushToken != null)
            {
                pushToken.IsActive = false;
                await dbContext.SaveChangesAsync();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error invalidating push token");
        }
    }

    private async Task<string?> GetAccessTokenAsync()
    {
        await _tokenLock.WaitAsync();
        try
        {
            if (!string.IsNullOrEmpty(_accessToken) && DateTime.UtcNow < _tokenExpiry)
            {
                return _accessToken;
            }

            var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var expiry = now + 3600;

            var header = new { alg = "RS256", typ = "JWT" };
            var payload = new
            {
                iss = _settings.ClientEmail,
                scope = "https://www.googleapis.com/auth/firebase.messaging",
                aud = "https://oauth2.googleapis.com/token",
                iat = now,
                exp = expiry
            };

            var headerBase64 = Base64UrlEncode(JsonSerializer.Serialize(header));
            var payloadBase64 = Base64UrlEncode(JsonSerializer.Serialize(payload));
            var unsignedToken = $"{headerBase64}.{payloadBase64}";

            var signature = SignWithRsa(unsignedToken, _settings.PrivateKey);
            var jwt = $"{unsignedToken}.{signature}";

            var tokenRequest = new FormUrlEncodedContent([
                new KeyValuePair<string, string>("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer"),
                new KeyValuePair<string, string>("assertion", jwt)
            ]);

            var response = await _httpClient.PostAsync("https://oauth2.googleapis.com/token", tokenRequest);
            
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogError("Failed to get Firebase access token: {Error}", error);
                return null;
            }

            var tokenResponse = await response.Content.ReadAsStringAsync();
            var tokenData = JsonSerializer.Deserialize<JsonElement>(tokenResponse);

            _accessToken = tokenData.GetProperty("access_token").GetString();
            _tokenExpiry = DateTime.UtcNow.AddSeconds(tokenData.GetProperty("expires_in").GetInt32() - 60);

            return _accessToken;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Firebase access token");
            return null;
        }
        finally
        {
            _tokenLock.Release();
        }
    }

    private static string Base64UrlEncode(string input)
    {
        var bytes = Encoding.UTF8.GetBytes(input);
        return Convert.ToBase64String(bytes)
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('=');
    }

    private static string SignWithRsa(string data, string privateKey)
    {
        var keyContent = privateKey
            .Replace("-----BEGIN PRIVATE KEY-----", "")
            .Replace("-----END PRIVATE KEY-----", "")
            .Replace("\\n", "")
            .Replace("\n", "")
            .Replace("\r", "")
            .Replace(" ", "")
            .Trim();
        var keyBytes = Convert.FromBase64String(keyContent);
        
        using var rsa = System.Security.Cryptography.RSA.Create();
        rsa.ImportPkcs8PrivateKey(keyBytes, out _);

        var dataBytes = Encoding.UTF8.GetBytes(data);
        var signatureBytes = rsa.SignData(dataBytes, System.Security.Cryptography.HashAlgorithmName.SHA256, System.Security.Cryptography.RSASignaturePadding.Pkcs1);

        return Convert.ToBase64String(signatureBytes)
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('=');
    }
}
