using Microsoft.Extensions.Logging;
using Resend;

namespace Swiftpay.Api.Core.Services;

public interface IEmailService
{
    Task SendPaymentReceivedAsync(string to, string name, long amount, string paymentId, CancellationToken ct);
}

public class ResendEmailService : IEmailService
{
    private readonly IResend _resend;
    private readonly ILogger<ResendEmailService> _logger;

    public ResendEmailService(IResend resend, ILogger<ResendEmailService> logger)
    {
        _resend = resend;
        _logger = logger;
    }

    public async Task SendPaymentReceivedAsync(string to, string name, long amount, string paymentId, CancellationToken ct)
    {
        var amountFormatted = $"R$ {amount / 100m:N2}";
        var msg = new EmailMessage();
        msg.From = "Swiftpay <noreply@swiftpay.com>";
        msg.To.Add(to);
        msg.Subject = $"Pagamento recebido - {amountFormatted}";
        msg.HtmlBody = $@"<div style='font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px'>
                <div style='background:#000;color:#fff;padding:24px;border-radius:12px 12px 0 0;text-align:center'>
                    <h1 style='margin:0;font-size:20px'>Swiftpay</h1>
                </div>
                <div style='border:1px solid #e2e2e2;border-top:0;padding:24px;border-radius:0 0 12px 12px'>
                    <h2>Ola {name}</h2>
                    <p>Voce recebeu um pagamento de <strong style='font-size:24px'>{amountFormatted}</strong></p>
                    <p style='color:#666'>ID: {paymentId}</p>
                </div>
            </div>";
        await _resend.EmailSendAsync(msg);
        _logger.LogInformation("Email sent to {Email} for payment {PaymentId}", to, paymentId);
    }
}
