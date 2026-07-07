using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Models.Settings;
using swiftpay_api_core.Interfaces;

namespace swiftpay_api.Endpoints.Admin.Users.SendUserEmailConfirmation;

public sealed class SendUserEmailConfirmationEndpoint(
    PrimaryDbContext dbContext,
    ISecurityLogService securityLog,
    IEmailService emailService,
    IOptions<PlatformSettingsOptions> platformSettings
) : Endpoint<SendUserEmailConfirmationRequest, SendUserEmailConfirmationResponse>
{
    public override void Configure()
    {
        Post("users/{userId:guid}/send-email-confirmation");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(SendUserEmailConfirmationRequest req, CancellationToken ct)
    {
        var adminId = EndpointUtils.GetUserId(User);
        if (adminId == null)
        {
            await Send.ResponseAsync(new SendUserEmailConfirmationResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var dbUser = await dbContext.Users
            .OrderBy(u => u.Id)
            .FirstOrDefaultAsync(u => u.Id == req.UserId, ct);

        if (dbUser == null)
        {
            await Send.ResponseAsync(new SendUserEmailConfirmationResponse
            {
                Error = new("Usuário não encontrado.")
            }, 404, ct);
            return;
        }

        if (dbUser.EmailVerified)
        {
            await Send.ResponseAsync(new SendUserEmailConfirmationResponse
            {
                Error = new("O email do usuário já foi verificado.")
            }, 400, ct);
            return;
        }

        // Invalidate existing tokens
        var existingTokens = await dbContext.EmailConfirmationTokens
            .Where(t => t.UserId == dbUser.Id && t.Status == EmailConfirmationTokenStatus.Pending)
            .ToListAsync(ct);

        foreach (var token in existingTokens)
        {
            token.Status = EmailConfirmationTokenStatus.ExpiredByNewToken;
        }

        // Create new token
        var tokenValue = CryptoUtils.GenerateToken();
        var tokenHash = CryptoUtils.ComputeSha256Hash(tokenValue);
        var expiresInHours = 24;

        var confirmationToken = new EmailConfirmationToken
        {
            UserId = dbUser.Id,
            TokenHash = tokenHash,
            Status = EmailConfirmationTokenStatus.Pending,
            ExpiresAt = DateTime.UtcNow.AddHours(expiresInHours),
            CreatedAt = DateTime.UtcNow
        };

        dbContext.EmailConfirmationTokens.Add(confirmationToken);
        await dbContext.SaveChangesAsync(ct);

        var baseUrl = platformSettings.Value.BaseUrl.TrimEnd('/');
        var confirmationUrl = $"{baseUrl}/confirm-email?token={tokenValue}&email={Uri.EscapeDataString(dbUser.Email)}";

        // Send email
        try
        {
            await emailService.SendAsync(
                dbUser.Email,
                "Confirme seu e-mail - SwiftPay",
                EmailTemplate.EmailConfirmation,
                new Dictionary<string, string>
                {
                    { "NAME", dbUser.Name },
                    { "CONFIRMATION_URL", confirmationUrl },
                    { "EXPIRES_IN", expiresInHours.ToString() }
                },
                userId: dbUser.Id
            );
        }
        catch
        {
            // Don't fail if email fails
        }

        await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.EmailConfirmationRequest, Status = SecurityLogStatus.Success, UserId = adminId, Details = $"Email de verificação enviado para o usuário {dbUser.Id} pelo admin." });

        await Send.OkAsync(new SendUserEmailConfirmationResponse
        {
            Data = new("Email de confirmação enviado com sucesso.")
        }, ct);
    }
}
