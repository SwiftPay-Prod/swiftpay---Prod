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
    IEmailIntentWriter emailIntentWriter,
    IEmailIntentRelaySignal emailIntentRelaySignal,
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

        await using var transaction = await dbContext.Database.BeginTransactionAsync(ct);
        var emailHandle = await emailIntentWriter.Add(new EmailIntentAddRequest
        {
            Dedupe = EmailIntentDedupeKey.ManualOperation(
                EmailMessageType.EmailConfirmation,
                Guid.NewGuid()),
            MessageType = EmailMessageType.EmailConfirmation,
            RecipientAddress = dbUser.Email,
            Owner = new EmailIntentOwner(EmailIntentOwnerType.User, dbUser.Id),
            CorrelationId = HttpContext.TraceIdentifier,
            Inputs = new Dictionary<string, string>
            {
                ["NAME"] = dbUser.Name
            },
            AuthAction = new EmailIntentAuthActionRequest
            {
                ActionType = EmailAuthActionType.VerifyEmail,
                ContinueUrl = $"{platformSettings.Value.BaseUrl.TrimEnd('/')}/?auth=signin"
            }
        }, ct);
        await dbContext.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        emailIntentRelaySignal.Signal();

        await securityLog.LogAsync(new SecurityLogInput
        {
            Action = SecurityLogAction.EmailConfirmationRequest,
            Status = SecurityLogStatus.Success,
            UserId = adminId,
            Details = $"Email de verificação enfileirado para o usuário {dbUser.Id} pelo admin."
        });

        await Send.ResponseAsync(new SendUserEmailConfirmationResponse
        {
            Data = new SendUserEmailConfirmationData(emailHandle.Id, "Pending"),
            Message = "Email de confirmação enfileirado."
        }, 202, ct);
    }
}
