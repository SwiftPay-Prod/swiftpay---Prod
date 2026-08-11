using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using swiftpay_api_core.Database;
using swiftpay_api_core.Utils;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Settings;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Auth.ForgotPassword;

public sealed class ForgotPasswordEndpoint(
    PrimaryDbContext dbContext,
    IEmailIntentWriter emailIntentWriter,
    IEmailIntentRelaySignal emailIntentRelaySignal,
    ISecurityLogService securityLog,
    IOptions<JWTSettingsOptions> jwtSettings,
    IOptions<PlatformSettingsOptions> platformSettings
) : Endpoint<ForgotPasswordRequest, ForgotPasswordResponse>
{
    public override void Configure()
    {
        Post("forgot-password");
        Group<AuthGroup>();
        AllowAnonymous();
    }

    public override async Task HandleAsync(ForgotPasswordRequest req, CancellationToken ct)
    {
        var emailLower = req.Email.ToLowerInvariant().Trim();
        var user = await dbContext.Users
            .OrderBy(u => u.Id)
            .FirstOrDefaultAsync(u => u.Email == emailLower, ct);

        var now = DateTime.UtcNow;
        var cooldownWindow = FloorToWindow(now, TimeSpan.FromMinutes(15));
        var emailHmac = CryptoUtils.ComputeHmacSha256(emailLower, jwtSettings.Value.Secret);
        var queued = false;

        await using var transaction = await dbContext.Database.BeginTransactionAsync(ct);

        if (user is not null)
        {
            await emailIntentWriter.Add(new EmailIntentAddRequest
            {
                Dedupe = EmailIntentDedupeKey.PasswordReset(emailHmac, cooldownWindow),
                MessageType = EmailMessageType.PasswordReset,
                RecipientAddress = user.Email,
                Owner = new EmailIntentOwner(EmailIntentOwnerType.User, user.Id),
                CorrelationId = HttpContext.TraceIdentifier,
                Inputs = new Dictionary<string, string>
                {
                    ["NAME"] = user.Name
                },
                AuthAction = new EmailIntentAuthActionRequest
                {
                    ActionType = EmailAuthActionType.PasswordReset,
                    ContinueUrl = $"{platformSettings.Value.BaseUrl.TrimEnd('/')}/?auth=signin"
                }
            }, ct);
            queued = true;
        }

        await dbContext.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);

        if (queued)
        {
            emailIntentRelaySignal.Signal();
            await securityLog.LogAsync(new SecurityLogInput
            {
                Action = SecurityLogAction.PasswordResetRequest,
                Status = SecurityLogStatus.Success,
                UserId = user!.Id
            });
        }

        await Send.ResponseAsync(new ForgotPasswordResponse
        {
            Message = "Se o e-mail estiver cadastrado, você receberá um link de recuperação. Para evitar spam, aguarde 15 minutos entre novas solicitações."
        }, 202, ct);
    }

    private static DateTime FloorToWindow(DateTime utcNow, TimeSpan window)
    {
        var ticks = utcNow.Ticks - (utcNow.Ticks % window.Ticks);
        return new DateTime(ticks, DateTimeKind.Utc);
    }
}
