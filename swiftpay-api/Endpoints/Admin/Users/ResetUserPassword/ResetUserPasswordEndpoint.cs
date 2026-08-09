using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Interfaces;

namespace swiftpay_api.Endpoints.Admin.Users.ResetUserPassword;

public sealed class ResetUserPasswordEndpoint(
    PrimaryDbContext dbContext,
    ISecurityLogService securityLog,
    IEmailIntentWriter emailIntentWriter,
    IEmailIntentRelaySignal emailIntentRelaySignal
) : Endpoint<ResetUserPasswordRequest, ResetUserPasswordResponse>
{
    public override void Configure()
    {
        Post("users/{userId:guid}/reset-password");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ResetUserPasswordRequest req, CancellationToken ct)
    {
        var adminId = EndpointUtils.GetUserId(User);
        if (adminId == null)
        {
            await Send.ResponseAsync(new ResetUserPasswordResponse
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
            await Send.ResponseAsync(new ResetUserPasswordResponse
            {
                Error = new("Usuário não encontrado.")
            }, 404, ct);
            return;
        }

        if (dbUser.Role == UserRole.God)
        {
            await Send.ResponseAsync(new ResetUserPasswordResponse
            {
                Error = new("Não é possível resetar a senha de um usuário God.")
            }, 403, ct);
            return;
        }

        var temporaryPassword = CryptoUtils.GenerateSecurePassword();
        dbUser.Password = BCrypt.Net.BCrypt.HashPassword(temporaryPassword);
        dbUser.PasswordChangedAt = DateTime.UtcNow;
        dbUser.UpdatedAt = DateTime.UtcNow;

        var emailHandle = await emailIntentWriter.Add(new EmailIntentAddRequest
        {
            Dedupe = EmailIntentDedupeKey.ManualOperation(
                EmailMessageType.AdminPasswordReset,
                Guid.NewGuid()),
            MessageType = EmailMessageType.AdminPasswordReset,
            RecipientAddress = dbUser.Email,
            Owner = new EmailIntentOwner(EmailIntentOwnerType.User, dbUser.Id),
            CorrelationId = HttpContext.TraceIdentifier,
            Inputs = new Dictionary<string, string>
            {
                ["NAME"] = dbUser.Name,
                ["PASSWORD"] = temporaryPassword
            }
        }, ct);

        await dbContext.SaveChangesAsync(ct);
        emailIntentRelaySignal.Signal();

        await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.PasswordResetComplete, Status = SecurityLogStatus.Success, UserId = adminId, Details = $"Senha do usuário {dbUser.Id} resetada pelo admin." });

        await Send.OkAsync(new ResetUserPasswordResponse
        {
            Data = new ResetUserPasswordData(temporaryPassword, emailHandle.Id, "Pending")
        }, ct);
    }
}
