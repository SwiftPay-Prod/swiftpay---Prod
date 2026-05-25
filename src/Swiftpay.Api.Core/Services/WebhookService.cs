using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Swiftpay.Domain.Entities;
using Swiftpay.Infrastructure.Data;

namespace Swiftpay.Api.Core.Services;

public class WebhookService
{
    private readonly IHttpClientFactory _httpFactory;
    private readonly ILogger<WebhookService> _logger;
    private readonly AppDbContext _db;

    public WebhookService(IHttpClientFactory httpFactory, ILogger<WebhookService> logger, AppDbContext db)
    {
        _httpFactory = httpFactory;
        _logger = logger;
        _db = db;
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

        var success = false;
        int? responseStatus = null;
        string? responseBody = null;

        for (int attempt = 1; attempt <= 3; attempt++)
        {
            try
            {
                var response = await client.SendAsync(request, ct);
                responseStatus = (int)response.StatusCode;
                responseBody = await response.Content.ReadAsStringAsync(ct);
                if (response.IsSuccessStatusCode) { success = true; break; }
                _logger.LogWarning("Webhook attempt {A}/3 for {Url}: HTTP {S}", attempt, config.Url, responseStatus);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Webhook attempt {A}/3 for {Url}: {E}", attempt, config.Url, ex.Message);
            }
            if (attempt < 3) await Task.Delay(TimeSpan.FromSeconds(Math.Pow(2, attempt)), ct);
        }

        var deliveryLog = new WebhookDeliveryLog
        {
            Id = Guid.NewGuid(),
            WebhookConfigurationId = config.Id,
            EventType = eventType,
            Url = config.Url,
            Status = success ? "Success" : "Failed",
            RequestBody = json,
            ResponseStatus = responseStatus,
            ResponseBody = responseBody,
            Attempts = 3,
            CreatedAt = DateTime.UtcNow,
            CompletedAt = DateTime.UtcNow,
        };
        _db.WebhookDeliveryLogs.Add(deliveryLog);
        await _db.SaveChangesAsync(ct);

        return success;
    }

    private static string ComputeHmacSha256(string payload, string secret)
    {
        var key = Encoding.UTF8.GetBytes(secret);
        var hash = HMACSHA256.HashData(key, Encoding.UTF8.GetBytes(payload));
        return Convert.ToHexString(hash).ToLower();
    }
}
