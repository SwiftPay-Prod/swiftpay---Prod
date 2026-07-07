using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Utils;
using swiftpay_api_payment.Interfaces;

namespace swiftpay_api_payment.Services;

public sealed class CashoutWebhookService(
    IServiceScopeFactory serviceScopeFactory,
    IHttpClientFactory httpClientFactory,
    ILogger<CashoutWebhookService> logger
) : ICashoutWebhookService
{
    private const int MaxRetries = 3;

    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public async Task SendWebhookAsync(Guid payoutId, string eventType)
    {
        using var scope = serviceScopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();
        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

        var payout = await dbContext.Payouts
            .Include(p => p.PayoutAccount)
            .FirstOrDefaultAsync(p => p.Id == payoutId);

        if (payout == null)
        {
            return;
        }

        if (string.IsNullOrEmpty(payout.CallbackUrl))
        {
            payout.CallbackStatus = CallbackStatus.NotConfigured;
            await dbContext.SaveChangesAsync();
            return;
        }

        payout.CallbackStatus = CallbackStatus.Pending;
        await dbContext.SaveChangesAsync();

        var webhookId = Guid.CreateVersion7().ToString();
        var payload = BuildPayload(payout, eventType, webhookId);
        var payloadJson = JsonSerializer.Serialize(payload, _jsonOptions);

        var signature = GenerateSignature(payloadJson, payout.Id.ToString());

        var result = await SendWithRetriesAsync(
            payout.CallbackUrl,
            payloadJson,
            signature,
            webhookId,
            eventType);

        var payoutToUpdate = await dbContext.Payouts.FindAsync(payoutId);
        if (payoutToUpdate == null)
        {
            return;
        }

        payoutToUpdate.CallbackAttempts = result.Attempts;
        payoutToUpdate.CallbackLastAttemptAt = DateTime.UtcNow;

        if (result.Success)
        {
            payoutToUpdate.CallbackStatus = CallbackStatus.Sent;
            payoutToUpdate.CallbackError = null;
        }
        else
        {
            payoutToUpdate.CallbackStatus = CallbackStatus.Failed;
            payoutToUpdate.CallbackError = result.Error;

            await CreateFailureNotificationAsync(notificationService, payoutToUpdate, eventType, result);
        }

        await dbContext.SaveChangesAsync();
    }

    private async Task CreateFailureNotificationAsync(
        INotificationService notificationService,
        Payout payout,
        string eventType,
        WebhookResult result)
    {
        try
        {
            await notificationService.CreateWarningNotificationAsync(
                payout.MerchantId,
                "Webhook de saque falhou",
                $"Webhook {eventType} falhou ({result.Attempts} tentativas).",
                NotificationPriority.High);
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Erro ao criar notificação de falha de webhook de saque: PayoutId={PayoutId}, MerchantId={MerchantId}",
                payout.Id, payout.MerchantId);
        }
    }

    private object BuildPayload(Payout payout, string eventType, string webhookId)
    {
        return new
        {
            id = webhookId,
            type = eventType,
            createdAt = DateTime.UtcNow,
            data = new
            {
                id = payout.Id,
                externalId = payout.ExternalId,
                amount = payout.Amount,
                fee = payout.PlatformFee,
                netAmount = payout.NetAmount,
                currency = "BRL",
                status = payout.Status.ToString(),
                environment = payout.Environment.ToString(),
                requestedAt = payout.RequestedAt,
                processedAt = payout.ProcessedAt,
                completedAt = payout.CompletedAt,
                failureReason = payout.FailureReason,
                pix = payout.PayoutAccount != null
                    ? new
                    {
                        pixKeyType = payout.PayoutAccount.PixKeyType.ToString(),
                        pixKey = MaskUtils.MaskPixKey(payout.PayoutAccount.PixKey, payout.PayoutAccount.PixKeyType.ToString()),
                        endToEndId = payout.PixEndToEndId
                    }
                    : null
            }
        };
    }

    private async Task<WebhookResult> SendWithRetriesAsync(
        string url,
        string payload,
        string signature,
        string webhookId,
        string eventType)
    {
        string? lastError = null;
        var attempt = 0;

        for (attempt = 1; attempt <= MaxRetries; attempt++)
        {
            try
            {
                var client = httpClientFactory.CreateClient("webhooks");

                var request = new HttpRequestMessage(HttpMethod.Post, url)
                {
                    Content = new StringContent(payload, Encoding.UTF8, "application/json")
                };

                request.Headers.Add("X-SwiftPay-Signature", signature);
                request.Headers.Add("X-SwiftPay-Event", eventType);
                request.Headers.Add("X-SwiftPay-Delivery", webhookId);
                request.Headers.Add("X-SwiftPay-Attempt", attempt.ToString());

                var response = await client.SendAsync(request);

                if (response.IsSuccessStatusCode)
                {
                    return new WebhookResult(true, attempt, null);
                }

                lastError = $"HTTP {(int)response.StatusCode}";
            }
            catch (TaskCanceledException)
            {
                lastError = "Timeout";
            }
            catch (HttpRequestException ex)
            {
                lastError = ex.Message;
            }
            catch (Exception ex)
            {
                lastError = ex.Message;
            }

            if (attempt < MaxRetries)
            {
                var delay = TimeSpan.FromSeconds(Math.Pow(2, attempt));
                await Task.Delay(delay);
            }
        }

        return new WebhookResult(false, attempt - 1, lastError);
    }

    private static string GenerateSignature(string payload, string secret)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        return $"sha256={Convert.ToHexString(hash).ToLower()}";
    }

    private sealed record WebhookResult(bool Success, int Attempts, string? Error);
}
