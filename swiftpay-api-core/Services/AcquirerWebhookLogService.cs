using Microsoft.Extensions.Logging;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Inputs;

namespace swiftpay_api_core.Services;

public sealed class AcquirerWebhookLogService(
    ILogQueue<AcquirerWebhookLogEntry> logQueue,
    ILogger<AcquirerWebhookLogService> logger
) : IAcquirerWebhookLogService
{
    public async Task LogAsync(AcquirerWebhookLogInput input)
    {
        if (string.IsNullOrWhiteSpace(input.AcquirerType)
            || string.IsNullOrWhiteSpace(input.AcquirerCode)
            || string.IsNullOrWhiteSpace(input.Endpoint)
            || string.IsNullOrWhiteSpace(input.HttpMethod))
        {
            return;
        }

        try
        {
            var entry = new AcquirerWebhookLogEntry
            {
                Id = Guid.CreateVersion7(),
                AcquirerId = input.AcquirerId,
                AcquirerType = input.AcquirerType,
                AcquirerCode = input.AcquirerCode,
                HttpMethod = input.HttpMethod,
                Endpoint = input.Endpoint,
                QueryString = input.QueryString,
                RequestHeaders = input.RequestHeaders,
                RequestBody = input.RequestBody,
                IpAddress = input.IpAddress,
                UserAgent = input.UserAgent,
                Location = input.Location,
                CorrelationId = input.CorrelationId,
                ContentType = input.ContentType,
                ContentLength = input.ContentLength,
                StatusCode = input.StatusCode,
                CreatedAt = DateTime.UtcNow
            };

            await logQueue.EnqueueAsync(entry);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to enqueue acquirer webhook log: AcquirerType={AcquirerType}, Endpoint={Endpoint}", input.AcquirerType, input.Endpoint);
        }
    }
}
