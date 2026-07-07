using System.Diagnostics;
using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Resend;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Settings;

namespace swiftpay_api_core.Services;

public class EmailService(
    IOptions<EmailSettingsOptions> emailSettings,
    IEmailTemplateProvider templateProvider,
    IEmailLogService emailLogService,
    IResend resend,
    ILogger<EmailService> logger
) : IEmailService
{
    private readonly EmailSettingsOptions _emailSettings = emailSettings.Value;

    public async Task SendAsync(
        string to,
        string subject,
        EmailTemplate template,
        Dictionary<string, string> parameters,
        Guid? userId = null,
        Guid? merchantId = null)
    {
        var templateName = template.ToString();

        if (!_emailSettings.EnableSend)
        {
            await emailLogService.LogSkippedAsync(
                to,
                subject,
                templateName,
                parameters,
                userId,
                merchantId);

            return;
        }

        var body = await templateProvider.GetTemplateContentAsync(template);

        foreach (var param in parameters)
        {
            body = body.Replace($"[[{param.Key}]]", param.Value);
        }

        var stopwatch = Stopwatch.StartNew();

        try
        {
            await SendEmailAsync(to, subject, body);
            stopwatch.Stop();

            await emailLogService.LogSuccessAsync(
                to,
                subject,
                templateName,
                parameters,
                userId,
                merchantId,
                stopwatch.ElapsedMilliseconds);
        }
        catch (Exception ex)
        {
            stopwatch.Stop();

            await emailLogService.LogFailureAsync(
                to,
                subject,
                templateName,
                ex.Message,
                parameters,
                userId,
                merchantId,
                stopwatch.ElapsedMilliseconds);

            throw;
        }
    }

    public async Task SendHtmlAsync(
        string to,
        string subject,
        string htmlContent,
        Guid? userId = null,
        Guid? merchantId = null,
        string? templateName = null)
    {
        var template = templateName ?? "CustomHtml";

        if (!_emailSettings.EnableSend)
        {
            await emailLogService.LogSkippedAsync(
                to,
                subject,
                template,
                new Dictionary<string, string>(),
                userId,
                merchantId);

            return;
        }

        var stopwatch = Stopwatch.StartNew();

        try
        {
            await SendEmailAsync(to, subject, htmlContent);
            stopwatch.Stop();

            await emailLogService.LogSuccessAsync(
                to,
                subject,
                template,
                new Dictionary<string, string>(),
                userId,
                merchantId,
                stopwatch.ElapsedMilliseconds);
        }
        catch (Exception ex)
        {
            stopwatch.Stop();

            await emailLogService.LogFailureAsync(
                to,
                subject,
                template,
                ex.Message,
                new Dictionary<string, string>(),
                userId,
                merchantId,
                stopwatch.ElapsedMilliseconds);

            throw;
        }
    }

    private async Task SendEmailAsync(string to, string subject, string body)
    {
        try
        {
            switch (_emailSettings.Provider)
            {
                case EmailProvider.Smtp:
                    await SendEmailViaSmtpAsync(to, subject, body);
                    break;
                case EmailProvider.Resend:
                    await SendEmailViaResendAsync(to, subject, body);
                    break;
                default:
                    throw new NotSupportedException($"Email provider '{_emailSettings.Provider}' is not supported");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send email to {Email} via {Provider}", to, _emailSettings.Provider);
            throw;
        }
    }

    private async Task SendEmailViaSmtpAsync(string to, string subject, string body)
    {
        if (_emailSettings.Smtp == null)
            throw new InvalidOperationException("SMTP configuration is missing");

        using var client = new SmtpClient(_emailSettings.Smtp.Host, _emailSettings.Smtp.Port)
        {
            Credentials = new NetworkCredential(_emailSettings.Smtp.Username, _emailSettings.Smtp.Password),
            EnableSsl = _emailSettings.Smtp.EnableSsl
        };

        var message = new MailMessage
        {
            From = new MailAddress(_emailSettings.FromEmail, _emailSettings.FromName),
            Subject = subject,
            Body = body,
            IsBodyHtml = true
        };
        message.To.Add(to);

        await client.SendMailAsync(message);
    }

    private async Task SendEmailViaResendAsync(string to, string subject, string body)
    {
        if (_emailSettings.Resend == null)
            throw new InvalidOperationException("Resend configuration is missing");

        var message = new EmailMessage
        {
            From = $"{_emailSettings.FromName} <{_emailSettings.FromEmail}>",
            To = [to],
            Subject = subject,
            HtmlBody = body
        };

        await resend.EmailSendAsync(message);
    }
}
