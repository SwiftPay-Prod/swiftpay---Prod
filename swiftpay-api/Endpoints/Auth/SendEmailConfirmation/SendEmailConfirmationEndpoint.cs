using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Models.Settings;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Interfaces;

namespace swiftpay_api.Endpoints.Auth.SendEmailConfirmation;

public sealed class SendEmailConfirmationEndpoint(
    PrimaryDbContext dbContext,
    IEmailIntentWriter emailIntentWriter,
    IEmailIntentRelaySignal emailIntentRelaySignal,
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
        var emailLower = req.Email.ToLowerInvariant().Trim();
        var user = await dbContext.Users
            .OrderBy(u => u.Id)
            .FirstOrDefaultAsync(u => u.Email == emailLower, ct);

        await using var transaction = await dbContext.Database.BeginTransactionAsync(ct);
        var queued = false;

        if (user is { EmailVerified: false } && !string.IsNullOrWhiteSpace(user.FirebaseUid))
        {
            var now = DateTime.UtcNow;
            var cooldownWindow = FloorToWindow(now, TimeSpan.FromMinutes(15));
            var continueUrl = $"{platformSettings.Value.BaseUrl.TrimEnd('/')}/?auth=signin";

            await emailIntentWriter.Add(new EmailIntentAddRequest
            {
                Dedupe = EmailIntentDedupeKey.VerificationResend(user.FirebaseUid, cooldownWindow),
                MessageType = EmailMessageType.EmailConfirmation,
                RecipientAddress = user.Email,
                Owner = new EmailIntentOwner(EmailIntentOwnerType.User, user.Id),
                CorrelationId = HttpContext.TraceIdentifier,
                Inputs = new Dictionary<string, string>
                {
                    ["NAME"] = user.Name
                },
                AuthAction = new EmailIntentAuthActionRequest
                {
                    ActionType = EmailAuthActionType.VerifyEmail,
                    FirebaseUid = user.FirebaseUid,
                    ContinueUrl = continueUrl
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
                Action = SecurityLogAction.EmailConfirmationRequest,
                Status = SecurityLogStatus.Success,
                UserId = user!.Id
            });
        }

        await Send.ResponseAsync(new SendEmailConfirmationResponse
        {
            Message = "Se o e-mail estiver cadastrado, você receberá um link de confirmação."
        }, 202, ct);
    }

    private static DateTime FloorToWindow(DateTime utcNow, TimeSpan window)
    {
        var ticks = utcNow.Ticks - (utcNow.Ticks % window.Ticks);
        return new DateTime(ticks, DateTimeKind.Utc);
    }
}
