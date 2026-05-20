using System.Text.Json;
using Microsoft.Extensions.Logging;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Inputs;
using Microsoft.AspNetCore.Http;

namespace safefy_api_core.Services;

public class EmailLogService(
    ILogQueue<EmailLogEntry> logQueue,
    IHttpContextAccessor httpContextAccessor,
    ILogger<EmailLogService> logger
) : IEmailLogService
{

    public async Task LogAsync(EmailLogInput input)
    {
        try
        {
            var httpContext = httpContextAccessor.HttpContext;

            var entry = new EmailLogEntry
            {
                Id = Guid.CreateVersion7(),
                UserId = input.UserId,
                MerchantId = input.MerchantId,
                To = input.To,
                Subject = input.Subject,
                Template = input.Template,
                Status = input.Status.ToString(),
                ErrorMessage = input.ErrorMessage,
                Parameters = input.Parameters != null
                    ? JsonSerializer.Serialize(input.Parameters)
                    : null,
                IpAddress = input.IpAddress ?? GetIpAddress(httpContext),
                SendTimeMs = input.SendTimeMs,
                CreatedAt = DateTime.UtcNow
            };

            await logQueue.EnqueueAsync(entry);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to enqueue email log for {To}", input.To);
        }
    }

    public async Task LogSuccessAsync(
        string to,
        string subject,
        string template,
        Dictionary<string, string>? parameters = null,
        Guid? userId = null,
        Guid? merchantId = null,
        long? sendTimeMs = null)
    {
        await LogAsync(new EmailLogInput
        {
            To = to,
            Subject = subject,
            Template = template,
            Status = EmailLogStatus.Sent,
            Parameters = parameters,
            UserId = userId,
            MerchantId = merchantId,
            SendTimeMs = sendTimeMs
        });
    }

    public async Task LogFailureAsync(
        string to,
        string subject,
        string template,
        string errorMessage,
        Dictionary<string, string>? parameters = null,
        Guid? userId = null,
        Guid? merchantId = null,
        long? sendTimeMs = null)
    {
        await LogAsync(new EmailLogInput
        {
            To = to,
            Subject = subject,
            Template = template,
            Status = EmailLogStatus.Failed,
            ErrorMessage = errorMessage,
            Parameters = parameters,
            UserId = userId,
            MerchantId = merchantId,
            SendTimeMs = sendTimeMs
        });
    }

    public async Task LogSkippedAsync(
        string to,
        string subject,
        string template,
        Dictionary<string, string>? parameters = null,
        Guid? userId = null,
        Guid? merchantId = null)
    {
        await LogAsync(new EmailLogInput
        {
            To = to,
            Subject = subject,
            Template = template,
            Status = EmailLogStatus.Skipped,
            Parameters = parameters,
            UserId = userId,
            MerchantId = merchantId
        });
    }

    private static string? GetIpAddress(HttpContext? context)
    {
        if (context == null) return null;

        var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedFor))
        {
            return forwardedFor.Split(',').First().Trim();
        }

        return context.Connection.RemoteIpAddress?.ToString();
    }
}
