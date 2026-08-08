using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using swiftpay_api_core.Database;
using swiftpay_api_core.Utils;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Models.Settings;
using swiftpay_api_core.Interfaces;

namespace swiftpay_api.Endpoints.Auth.SendEmailConfirmation;

public sealed class SendEmailConfirmationEndpoint(
    PrimaryDbContext dbContext,
    IEmailService emailService,
    ISecurityLogService securityLog,
    IOptions<PlatformSettingsOptions> platformSettings
) : Endpoint<SendEmailConfirmationRequest, SendEmailConfirmationResponse>
{
    public override void Configure()
    {
        Post("send-email-confirmation");
        Group<AuthGroup>();
        AllowAnonymous();
    }

    public override async Task HandleAsync(SendEmailConfirmationRequest req, CancellationToken ct)
    {
        var emailLower = req.Email.ToLower().Trim();

        var user = await dbContext.Users
            .OrderBy(u => u.Id)
            .FirstOrDefaultAsync(u => u.Email == emailLower, ct);

        if (user == null)
        {
            await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.EmailConfirmationRequest, Status = SecurityLogStatus.Failed, Details = $"User not found: {emailLower}" });

            await Send.OkAsync(new SendEmailConfirmationResponse
            {
                Message = "Se o e-mail estiver cadastrado,  você receberá um link de confirmação."
            }, ct);
            return;
        }

        if (user.EmailVerified)
        {
            await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.EmailConfirmationRequest, Status = SecurityLogStatus.Failed, UserId = user.Id, Details = "Email already verified" });

            await Send.ResponseAsync(new SendEmailConfirmationResponse
            {
                Error = new("E-mail já foi confirmado.")
            }, 400, ct);
            return;
        }

        var existingTokens = await dbContext.EmailConfirmationTokens
            .Where(t => t.UserId == user.Id && t.Status == EmailConfirmationTokenStatus.Pending)
            .ToListAsync(ct);

        foreach (var existingToken in existingTokens)
        {
            existingToken.Status = EmailConfirmationTokenStatus.ExpiredByNewToken;
        }

        var token = CryptoUtils.GenerateToken();
        var tokenHash = CryptoUtils.ComputeSha256Hash(token);
        var expiresInHours = 24;

        var confirmationToken = new EmailConfirmationToken
        {
            UserId = user.Id,
            TokenHash = tokenHash,
            Status = EmailConfirmationTokenStatus.Pending,
            ExpiresAt = DateTime.UtcNow.AddHours(expiresInHours),
            CreatedAt = DateTime.UtcNow
        };

        dbContext.EmailConfirmationTokens.Add(confirmationToken);
        await dbContext.SaveChangesAsync(ct);

        var baseUrl = platformSettings.Value.BaseUrl.TrimEnd('/');
        var confirmationUrl = $"{baseUrl}/confirm-email?token={token}&email={Uri.EscapeDataString(user.Email)}";

        try
        {
            await SendEmailConfirmationAsync(user, confirmationUrl, expiresInHours);
        }
        catch
        {
            confirmationToken.Status = EmailConfirmationTokenStatus.ExpiredByNewToken;
            await dbContext.SaveChangesAsync(ct);
            await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.EmailConfirmationRequest, Status = SecurityLogStatus.Failed, UserId = user.Id, Details = "Transactional email provider rejected the confirmation email" });

            await Send.ResponseAsync(new SendEmailConfirmationResponse
            {
                Error = new("Não foi possível enviar o e-mail de confirmação pelo provedor principal.")
                {
                    Code = "EMAIL_DELIVERY_FAILED"
                }
            }, 503, ct);
            return;
        }

        await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.EmailConfirmationRequest, Status = SecurityLogStatus.Success, UserId = user.Id });

        await Send.OkAsync(new SendEmailConfirmationResponse
        {
            Message = "Se o e-mail estiver cadastrado, você receberá um link de confirmação."
        }, ct);
    }

    private Task SendEmailConfirmationAsync(User user, string confirmationUrl, int expiresInHours)
    {
        return emailService.SendAsync(
            user.Email,
            "Confirme seu e-mail - SwiftPay",
            EmailTemplate.EmailConfirmation,
            new Dictionary<string, string>
            {
                { "NAME", user.Name },
                { "CONFIRMATION_URL", confirmationUrl },
                { "EXPIRES_IN", expiresInHours.ToString() }
            },
            userId: user.Id
        );
    }
}
