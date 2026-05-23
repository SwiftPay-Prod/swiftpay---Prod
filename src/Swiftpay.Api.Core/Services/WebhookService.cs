using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Swiftpay.Domain.Entities;

namespace Swiftpay.Api.Core.Services;

public class WebhookService
{
    private readonly IHttpClientFactory _httpFactory;
    private readonly ILogger<WebhookService> _logger;

    public WebhookService(IHttpClientFactory httpFactory, ILogger<WebhookService> logger)
    {
        _httpFactory = httpFactory;
        _logger = logger;
    }

    public async Task<bool> SendAsync(WebhookConfiguration config, string eventType, object payload, CancellationToken ct)
    {
        var json = JsonSerializer.Serialize(payload);
        var signature = ComputeHmacSha256(json, config.Secret);
        var client = _httpFactory.CreateClient("webhook");
        var request = new HttpRequestMessage(HttpMethod.Post, config.Url)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json"),
        };
        request.Headers.Add("X-Swiftpay-Signature", $"sha256={signature}");
        request.Headers.Add("X-Swiftpay-Event", eventType);
        request.Headers.Add("X-Swiftpay-Delivery", Guid.NewGuid().ToString());

        for (int attempt = 1; attempt <= 3; attempt++)
        {
            try
            {
                var response = await client.SendAsync(request, ct);
                if (response.IsSuccessStatusCode) return true;
                _logger.LogWarning("Webhook attempt {A}/3 for {Url}: HTTP {S}", attempt, config.Url, (int)response.StatusCode);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Webhook attempt {A}/3 for {Url}: {E}", attempt, config.Url, ex.Message);
            }
            if (attempt < 3) await Task.Delay(TimeSpan.FromSeconds(Math.Pow(2, attempt)), ct);
        }
        return false;
    }

    private static string ComputeHmacSha256(string payload, string secret)
    {
        var key = Encoding.UTF8.GetBytes(secret);
        var hash = HMACSHA256.HashData(key, Encoding.UTF8.GetBytes(payload));
        return Convert.ToHexString(hash).ToLower();
    }
}
