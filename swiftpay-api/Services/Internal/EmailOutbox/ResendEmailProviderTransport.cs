using System.Net;
using Resend;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Email;

namespace swiftpay_api.Services.Internal.EmailOutbox;

public sealed class ResendEmailProviderTransport(IResend resend) : IEmailProviderTransport
{
    public async Task<EmailProviderResult> SendAsync(
        EmailOutboxEnvelope envelope,
        CancellationToken cancellationToken = default)
    {
        var message = new EmailMessage
        {
            From = envelope.From,
            To = [envelope.Recipient],
            ReplyTo = envelope.ReplyTo,
            Subject = envelope.Subject,
            HtmlBody = envelope.HtmlBody,
            TextBody = envelope.TextBody
        };

        try
        {
            var response = await resend.EmailSendAsync(
                envelope.IntentId.ToString("N"),
                message,
                cancellationToken);
            if (response.Success)
            {
                return EmailProviderResult.Accepted(response.Content.ToString("D"));
            }

            return Classify(response.Exception);
        }
        catch (ResendException exception)
        {
            return Classify(exception);
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
        catch (HttpRequestException)
        {
            return new EmailProviderResult(
                EmailProviderOutcome.Ambiguous,
                null,
                "ProviderNetwork",
                "NetworkFailure",
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
