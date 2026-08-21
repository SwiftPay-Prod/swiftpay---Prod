using swiftpay_api_core.Models.Database;
using Microsoft.Extensions.Logging;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Inputs;

namespace swiftpay_api.Services.Internal.EmailOutbox;

public sealed class DirectResendEmailOutboxPublisher(
    IEmailProviderTransport transport,
    IEmailLogService emailLogService,
    ILogger<DirectResendEmailOutboxPublisher> logger) : IEmailOutboxPublisher
{
    public async Task<EmailOutboxPublishResult> PublishAsync(
        EmailOutboxPublishRequest request,
        CancellationToken cancellationToken = default)
    {
        var envelope = request.Envelope;

        try
        {
            var result = await transport.SendAsync(envelope, cancellationToken);

            if (result.Outcome == EmailProviderOutcome.Accepted)
            {
                logger.LogInformation("Email intent {IntentId} sent successfully via Resend. MessageId: {MessageId}",
                    envelope.IntentId, result.ProviderMessageId);

                await emailLogService.LogAsync(new EmailLogInput
                {
                    UserId = envelope.UserId,
                    MerchantId = envelope.MerchantId,
                    To = envelope.Recipient,
                    Subject = envelope.Subject,
                    Template = envelope.MessageType.ToString(),
                    Status = EmailLogStatus.Sent,
                    Parameters = new Dictionary<string, string>
                    {
                        ["MessageId"] = result.ProviderMessageId ?? string.Empty,
                        ["CorrelationId"] = envelope.CorrelationId
                    }
                });
                return new EmailOutboxPublishResult(
                    envelope.IntentId,
                    EmailOutboxPublishOutcome.Created,
                    EmailOutboxStatus.Accepted);
            }

            if (result.Outcome == EmailProviderOutcome.PermanentFailure)
            {
                logger.LogError("Email intent {IntentId} failed permanently via Resend: {ErrorCode} - {ErrorClass}",
                    envelope.IntentId, result.SafeErrorCode, result.SafeErrorClass);

                await emailLogService.LogAsync(new EmailLogInput
                {
                    UserId = envelope.UserId,
                    MerchantId = envelope.MerchantId,
                    To = envelope.Recipient,
                    Subject = envelope.Subject,
                    Template = envelope.MessageType.ToString(),
                    Status = EmailLogStatus.Failed,
                    ErrorMessage = $"{result.SafeErrorClass}: {result.SafeErrorCode}"
                });
                return new EmailOutboxPublishResult(
                    envelope.IntentId,
                    EmailOutboxPublishOutcome.Created,
                    EmailOutboxStatus.Failed);
            }

            logger.LogWarning("Email intent {IntentId} returned retryable error via Resend: {ErrorCode}",
                envelope.IntentId, result.SafeErrorCode);

            return new EmailOutboxPublishResult(
                envelope.IntentId,
                EmailOutboxPublishOutcome.Created,
                EmailOutboxStatus.RetryScheduled);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unexpected exception publishing email intent {IntentId} via Resend", envelope.IntentId);
            return new EmailOutboxPublishResult(
                envelope.IntentId,
                EmailOutboxPublishOutcome.Created,
                EmailOutboxStatus.RetryScheduled);
        }
    }
}
