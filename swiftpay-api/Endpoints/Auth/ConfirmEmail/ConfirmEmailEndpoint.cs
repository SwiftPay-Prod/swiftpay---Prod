using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Constants;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api.Hubs;
using Microsoft.AspNetCore.SignalR;
using swiftpay_api.Mappers;
using swiftpay_api.Interfaces;

namespace swiftpay_api.Endpoints.Auth.ConfirmEmail;

public sealed class ConfirmEmailEndpoint(
    PrimaryDbContext dbContext,
    ISecurityLogService securityLog,
    IHubContext<MainHub> authHub,
    ISessionService sessionService
) : Endpoint<ConfirmEmailRequest, ConfirmEmailResponse>
{
    public override void Configure()
    {
        Post("confirm-email");
        Group<AuthGroup>();
        AllowAnonymous();
    }

    public override async Task HandleAsync(ConfirmEmailRequest req, CancellationToken ct)
    {
        var emailLower = req.Email.ToLower().Trim();
        var tokenHash = CryptoUtils.ComputeSha256Hash(req.Token);

        var user = await dbContext.Users
            .OrderBy(u => u.Id)
            .FirstOrDefaultAsync(u => u.Email == emailLower, ct);

        if (user == null)
        {
            await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.EmailConfirmationComplete, Status = SecurityLogStatus.Failed, Details = $"User not found: {emailLower}" });

            await Send.ResponseAsync(new ConfirmEmailResponse
            {
                Error = new("Token inválido ou expirado.")
            }, 400, ct);
            return;
        }

        if (user.EmailVerified)
        {
            await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.EmailConfirmationComplete, Status = SecurityLogStatus.Failed, UserId = user.Id, Details = "Email already verified" });

            await Send.ResponseAsync(new ConfirmEmailResponse
            {
                Error = new("E-mail já foi confirmado.")
            }, 400, ct);
            return;
        }

        var confirmationToken = await dbContext.EmailConfirmationTokens
            .Where(t => t.UserId == user.Id && t.TokenHash == tokenHash)
            .OrderByDescending(t => t.CreatedAt)
            .OrderBy(x => x.Id)
            .FirstOrDefaultAsync(ct);

        if (confirmationToken == null)
        {
            await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.EmailConfirmationComplete, Status = SecurityLogStatus.Failed, UserId = user.Id, Details = "Invalid token" });

            await Send.ResponseAsync(new ConfirmEmailResponse
            {
                Error = new("Token inválido ou expirado.")
            }, 400, ct);
            return;
        }

        if (confirmationToken.IsExpired && confirmationToken.Status == EmailConfirmationTokenStatus.Pending)
        {
            confirmationToken.Status = EmailConfirmationTokenStatus.ExpiredByTime;
            await dbContext.SaveChangesAsync(ct);
        }

        if (!confirmationToken.IsValid)
        {
            await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.EmailConfirmationComplete, Status = SecurityLogStatus.Failed, UserId = user.Id, Details = $"Token expired or already used. Status: {confirmationToken.Status}" });

            await Send.ResponseAsync(new ConfirmEmailResponse
            {
                Error = new("Token inválido ou expirado.")
            }, 400, ct);
            return;
        }

        confirmationToken.Status = EmailConfirmationTokenStatus.Used;

        user.EmailVerified = true;

        await dbContext.SaveChangesAsync(ct);

        await sessionService.UpdateEmailVerifiedAsync(user.Id, true);

        await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.EmailConfirmationComplete, Status = SecurityLogStatus.Success, UserId = user.Id });

        var userInfo = UserMapper.ToUserInfo(user);

        await authHub.Clients.User(user.Id.ToString()).SendAsync(SignalRMethods.EmailVerified, userInfo, ct);

        await Send.OkAsync(new ConfirmEmailResponse
        {
            Data = userInfo,
            Message = "E-mail confirmado com sucesso."
        }, ct);
    }
}
