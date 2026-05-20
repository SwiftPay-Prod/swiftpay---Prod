using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Database;
using safefy_api_payment.Interfaces;

namespace safefy_api_payment.Services;

public class WebhookService(
    IServiceScopeFactory serviceScopeFactory,
    IHttpClientFactory httpClientFactory,
    ILogger<WebhookService> logger
) : IWebhookService
{
    private const int MaxRetries = 3;
    private const int TimeoutSeconds = 30;
    
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public async Task SendWebhookAsync(Guid paymentId, string eventType)
    {
        using var scope = serviceScopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();
        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

        var payment = await dbContext.Payments
            .Include(p => p.PaymentPix)
            .FirstOrDefaultAsync(p => p.Id == paymentId);
        
        if (payment == null)
        {
            return;
        }

        if (payment.SuppressWebhookAndNotification || payment.IsWayneProtocol)
        {
            return;
        }

        if (string.IsNullOrEmpty(payment.CallbackUrl))
        {
            payment.CallbackStatus = CallbackStatus.NotConfigured;
            await dbContext.SaveChangesAsync();
            return;
        }

        // Marcar como pendente antes de enviar
        payment.CallbackStatus = CallbackStatus.Pending;
        await dbContext.SaveChangesAsync();

        var webhookId = Guid.CreateVersion7().ToString();
        var payload = BuildPayload(payment, eventType, webhookId);
        var payloadJson = JsonSerializer.Serialize(payload, _jsonOptions);

        // Gera uma assinatura baseada no PaymentId como secret
        var signature = GenerateSignature(payloadJson, payment.Id.ToString());

        var result = await SendWithRetriesAsync(
            payment.CallbackUrl,
            payloadJson,
            signature,
            webhookId,
            eventType,
            payment.Id,
            payment.MerchantId);

        // Recarregar a entidade do contexto para evitar erro de contexto descartado
        // após operações longas (envio de webhook com retries)
        var paymentToUpdate = await dbContext.Payments.FindAsync(paymentId);
        if (paymentToUpdate == null)
        {
            return;
        }

        paymentToUpdate.CallbackAttempts = result.Attempts;
        paymentToUpdate.CallbackLastAttemptAt = DateTime.UtcNow;
        
        if (result.Success)
        {
            paymentToUpdate.CallbackStatus = CallbackStatus.Sent;
            paymentToUpdate.CallbackError = null;
        }
        else
        {
            paymentToUpdate.CallbackStatus = CallbackStatus.Failed;
            paymentToUpdate.CallbackError = result.Error;
            
            await CreateFailureNotificationAsync(notificationService, paymentToUpdate, eventType, result);
        }
        
        await dbContext.SaveChangesAsync();
    }

    private async Task CreateFailureNotificationAsync(
        INotificationService notificationService,
        Payment payment,
        string eventType,
        WebhookResult result)
    {
        try
        {
            var title = "Webhook falhou";
            var message = $"Webhook {eventType} falhou ({result.Attempts} tentativas).";

            await notificationService.CreateWarningNotificationAsync(
                payment.MerchantId,
                title,
                message,
                NotificationPriority.High);
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Erro ao criar notificação de falha de webhook: PaymentId={PaymentId}, MerchantId={MerchantId}",
                payment.Id, payment.MerchantId);
        }
    }

    private object BuildPayload(Payment payment, string eventType, string webhookId)
    {
        var payload = new
        {
            id = webhookId,
            type = eventType,
            createdAt = DateTime.UtcNow,
            data = new
            {
                id = payment.Id,
                externalId = payment.ExternalId,
                amount = payment.Amount,
                fee = payment.PlatformFee + payment.CheckoutTemplateFee,
                netAmount = payment.NetAmount,
                currency = payment.Currency.ToString(),
                method = payment.Method.ToString(),
                status = payment.Status.ToString(),
                environment = payment.Environment.ToString(),
                description = payment.Description,
                completedAt = payment.CompletedAt,
                refundedAt = payment.RefundedAt,
                expiresAt = payment.ExpiresAt,
                failureReason = payment.FailureReason,
                customerId = payment.CustomerId,
                pix = payment.PaymentPix != null ? new
                {
                    txId = payment.PaymentPix.TxId,
                    endToEndId = payment.PaymentPix.EndToEndId,
                    payerName = payment.PaymentPix.PayerName,
                    payerDocument = payment.PaymentPix.PayerDocument,
                    payerBank = payment.PaymentPix.PayerBank
                } : null
            }
        };

        return payload;
    }

    private async Task<WebhookResult> SendWithRetriesAsync(
        string url,
        string payload,
        string signature,
        string webhookId,
        string eventType,
        Guid paymentId,
        Guid merchantId)
    {
        string? lastError = null;
        int? lastStatusCode = null;
        int attempt = 0;

        for (attempt = 1; attempt <= MaxRetries; attempt++)
        {
            try
            {
                // Use the named "webhooks" HttpClient with resilience policies
                var client = httpClientFactory.CreateClient("webhooks");

                var request = new HttpRequestMessage(HttpMethod.Post, url)
                {
                    Content = new StringContent(payload, Encoding.UTF8, "application/json")
                };

                request.Headers.Add("X-Safefy-Signature", signature);
                request.Headers.Add("X-Safefy-Event", eventType);
                request.Headers.Add("X-Safefy-Delivery", webhookId);
                request.Headers.Add("X-Safefy-Attempt", attempt.ToString());

                var response = await client.SendAsync(request);

                if (response.IsSuccessStatusCode)
                {
                    return new WebhookResult(true, attempt, null);
                }

                lastStatusCode = (int)response.StatusCode;
                lastError = $"HTTP {lastStatusCode}";
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
                // Exponential backoff: 2s, 4s, 8s...
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
