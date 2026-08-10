using System.Net;
using Resend;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Email;

namespace swiftpay_api.Services.Internal.EmailOutbox;

public sealed class ResendEmailProviderTransport(IResend resend) : IEmailProviderTransport
{
    /// <summary>
    /// Hard ceiling for a single provider call, applied unconditionally via
    /// Task.WhenAny. The Resend SDK sometimes fails to honor the caller's
    /// CancellationToken (the await then never completes); this watchdog
    /// guarantees SendAsync always returns so the outbox worker can never be
    /// wedged on a single intent.
    /// </summary>
    private static readonly TimeSpan HardCeiling = TimeSpan.FromSeconds(45);

    public async Task<EmailProviderResult> SendAsync(
        EmailOutboxEnvelope envelope,
        CancellationToken cancellationToken = default)
    {
        var message = new EmailMessage
        {
            From = envelope.From,
            To = [envelope.Recipient],
            Subject = envelope.Subject,
            HtmlBody = envelope.HtmlBody,
            TextBody = envelope.TextBody
        };
        if (envelope.ReplyTo is { Length: > 0 })
        {
            // Assign only when non-null: the SDK's implicit operator
            // EmailAddressList(string) crashes with ArgumentNullException
            // when invoked with null (effectively any doc without replyTo).
            message.ReplyTo = envelope.ReplyTo;
        }

        try
        {
            var sendTask = resend.EmailSendAsync(
                envelope.IntentId.ToString("N"),
                message,
                cancellationToken);

            var completed = await Task.WhenAny(sendTask, Task.Delay(HardCeiling, CancellationToken.None));
            if (completed != sendTask)
            {
                // The SDK did not honor the token; do not await the orphaned task.
                _ = sendTask.ContinueWith(
                    static t => _ = t.Exception,
                    CancellationToken.None,
                    TaskContinuationOptions.OnlyOnFaulted | TaskContinuationOptions.ExecuteSynchronously,
                    TaskScheduler.Default);
                return new EmailProviderResult(
                    EmailProviderOutcome.Ambiguous,
                    null,
                    "ProviderTimeout",
                    "Timeout",
                    null);
            }

            var response = await sendTask;
            if (response.Success)
            {
                return EmailProviderResult.Accepted(response.Content.ToString("D"));
            }

            return Classify(response.Exception);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            return new EmailProviderResult(
                EmailProviderOutcome.Ambiguous,
                null,
                "ProviderTimeout",
                "Timeout",
                null);
        }
        catch (ResendException exception)
        {
            return Classify(exception);
        }
        catch (HttpRequestException)
        {
            return new EmailProviderResult(
                EmailProviderOutcome.Ambiguous,
                null,
                "ProviderNetwork",
                "NetworkFailure",
                null);
        }
        catch (Exception exception)
        {
            // Contract violations (e.g. a null/empty address reaching the SDK)
            // and any other unexpected failure must NEVER escape SendAsync —
            // an escape wedges the outbox worker in ExecuteAsync's finally.
            return new EmailProviderResult(
                EmailProviderOutcome.Ambiguous,
                null,
                "ProviderUnknown",
                exception.GetType().Name,
                null);
        }
    }

    private static EmailProviderResult Classify(ResendException? exception)
    {
        if (exception is null)
        {
            return new EmailProviderResult(
                EmailProviderOutcome.Ambiguous,
                null,
                "ProviderUnknown",
                "UnknownFailure",
                null);
        }

        if (exception.StatusCode == HttpStatusCode.TooManyRequests ||
            exception.ErrorType == ErrorType.RateLimitExceeded)
        {
            var retryAfter = exception.Limits?.RetryAfter is > 0
                ? TimeSpan.FromSeconds(exception.Limits.RetryAfter.Value)
                : TimeSpan.FromMinutes(1);
            return new EmailProviderResult(
                EmailProviderOutcome.RateLimited,
                null,
                "ProviderRateLimit",
                "RateLimited",
                retryAfter);
        }

        if (exception.StatusCode is >= HttpStatusCode.BadRequest and < HttpStatusCode.InternalServerError &&
            exception.StatusCode is not HttpStatusCode.RequestTimeout and not HttpStatusCode.Conflict)
        {
            return new EmailProviderResult(
                EmailProviderOutcome.PermanentFailure,
                null,
                "ProviderRejected",
                exception.ErrorType.ToString(),
                null);
        }

        if (exception.StatusCode is >= HttpStatusCode.InternalServerError || exception.IsTransient)
        {
            return new EmailProviderResult(
                EmailProviderOutcome.TransientFailure,
                null,
                "ProviderTransient",
                exception.ErrorType.ToString(),
                null);
        }

        return new EmailProviderResult(
            EmailProviderOutcome.Ambiguous,
            null,
            "ProviderUnknown",
            exception.ErrorType.ToString(),
            null);
    }
}
