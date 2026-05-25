using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swiftpay.Api.Core.Messages;
using Swiftpay.Domain.Entities;
using Swiftpay.Infrastructure.Data;

namespace Swiftpay.Api.Payment.Controllers;

[ApiController]
[Route("api/v1/internal")]
public class InternalController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IPublishEndpoint _publish;
    private readonly IConfiguration _config;
    private readonly ILogger<InternalController> _logger;

    public InternalController(AppDbContext db, IPublishEndpoint publish, IConfiguration config, ILogger<InternalController> logger)
    {
        _db = db;
        _publish = publish;
        _config = config;
        _logger = logger;
    }

    [HttpPost("magicpay/webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> MagicPayWebhook(CancellationToken ct)
    {
        // 1. Read raw body for signature verification
        string rawBody;
        using (var reader = new StreamReader(Request.Body, Encoding.UTF8))
            rawBody = await reader.ReadToEndAsync(ct);

        // 2. Validate HMAC signature
        var signatureHeader = Request.Headers["X-MagicPay-Signature"].FirstOrDefault();
        var webhookSecret = _config["MagicPay:WebhookSecret"] ?? _config["MagicPay:ApiKey"];

        if (string.IsNullOrEmpty(signatureHeader) || string.IsNullOrEmpty(webhookSecret))
        {
            _logger.LogWarning("Webhook rejected: missing signature or secret");
            return Unauthorized(new { success = false, message = "Missing signature" });
        }

        var computedSignature = ComputeHmacSha256(rawBody, webhookSecret);
        if (!VerifyHmac(signatureHeader, computedSignature))
        {
            _logger.LogWarning("Webhook rejected: invalid signature. Received: {Sig}", signatureHeader);
            return Unauthorized(new { success = false, message = "Invalid signature" });
        }

        // 3. Parse payload
        JsonElement payload;
        try { payload = JsonDocument.Parse(rawBody).RootElement; }
        catch
        {
            _logger.LogWarning("Webhook rejected: invalid JSON");
            return BadRequest(new { success = false, message = "Invalid JSON" });
        }

        // 4. Validate required fields
        if (!payload.TryGetProperty("id", out var webhookIdProp))
            return BadRequest(new { success = false, message = "Missing id" });
        if (!payload.TryGetProperty("status", out var statusProp))
            return BadRequest(new { success = false, message = "Missing status" });
        if (!payload.TryGetProperty("externalRef", out var extRefProp))
            return BadRequest(new { success = false, message = "Missing externalRef" });

        var webhookId = webhookIdProp.GetString()!;
        var status = statusProp.GetString()!;
        var externalRef = extRefProp.GetString()!;

        // 5. Idempotency check - use webhook id to prevent duplicate processing
        var alreadyProcessed = await _db.Set<WebhookDeliveryLog>()
            .AnyAsync(l => l.RequestBody != null && l.RequestBody.Contains(webhookId), ct);
        if (alreadyProcessed)
        {
            _logger.LogInformation("Webhook {WebhookId} already processed, skipping", webhookId);
            return Ok(new { success = true, message = "Already processed" });
        }

        // 6. Process payment
        var payment = await _db.Payments.FirstOrDefaultAsync(p => p.ExternalId == externalRef, ct);
        if (payment == null)
        {
            _logger.LogWarning("Webhook for unknown payment: {ExternalRef}", externalRef);
            return NotFound(new { success = false, message = "Payment not found" });
        }

        payment.Status = status;
        if (status == "PAID")
        {
            payment.PaidAt = DateTime.UtcNow;
            if (payload.TryGetProperty("data", out var data) && data.TryGetProperty("e2e", out var e2e))
            {
                if (payment.Pix != null) payment.Pix.EndToEndId = e2e.GetString();
            }
        }

        // 7. Log webhook delivery
        _db.Set<WebhookDeliveryLog>().Add(new WebhookDeliveryLog
        {
            Id = Guid.NewGuid(),
            EventType = $"payment.{status.ToLower()}",
            Url = Request.Headers["X-Forwarded-For"].FirstOrDefault() ?? "unknown",
            Status = "Success",
            RequestBody = rawBody.Length > 4000 ? rawBody[..4000] : rawBody,
            Attempts = 1,
            CreatedAt = DateTime.UtcNow,
        });

        await _db.SaveChangesAsync(ct);

        // 8. Publish message if paid
        if (status == "PAID")
        {
            await _publish.Publish(new PaymentCompletedMessage(
                payment.Id, payment.MerchantId, payment.MerchantAcquirerId, "PAID", payment.Amount,
                payment.MerchantSettlementAmount, payment.AcquirerFee,
                payment.Environment), ct);
        }

        _logger.LogInformation("Webhook processed: {WebhookId} -> {Status} for {ExternalRef}", webhookId, status, externalRef);
        return Ok(new { success = true });
    }

    private static string ComputeHmacSha256(string payload, string secret)
    {
        var key = Encoding.UTF8.GetBytes(secret);
        var hash = HMACSHA256.HashData(key, Encoding.UTF8.GetBytes(payload));
        return Convert.ToHexString(hash).ToLower();
    }

    private static bool VerifyHmac(string received, string computed)
    {
        var receivedBytes = Encoding.UTF8.GetBytes(received);
        var computedBytes = Encoding.UTF8.GetBytes(computed);
        return CryptographicOperations.FixedTimeEquals(receivedBytes, computedBytes);
    }
}
