using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Interfaces;

namespace swiftpay_api.Endpoints.Users.ChangePassword;

public sealed class ChangePasswordEndpoint(
    PrimaryDbContext dbContext,
    IEmailIntentWriter emailIntentWriter,
    IEmailIntentRelaySignal emailIntentRelaySignal,
    ISecurityLogService securityLog
) : Endpoint<ChangePasswordRequest, ChangePasswordResponse>
{
    public override void Configure()
    {
        Post("request-change-password");
        Group<UserGroup>();
    }

    public override async Task HandleAsync(ChangePasswordRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ChangePasswordResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var dbUser = await dbContext.Users
            .OrderBy(u => u.Id)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);

        if (dbUser == null)
        {
            await Send.ResponseAsync(new ChangePasswordResponse
            {
                Error = new("Usuário não encontrado.")
            }, 404, ct);
            return;
        }

        if (!BCrypt.Net.BCrypt.Verify(req.CurrentPassword, dbUser.Password))
        {
            await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.PasswordChange, Status = SecurityLogStatus.Failed, UserId = userId, Details = "Senha atual incorreta." });

            await Send.ResponseAsync(new ChangePasswordResponse
            {
                Error = new("Senha atual incorreta.")
            }, 400, ct);
            return;
        }

        var existingCodes = await dbContext.PasswordChangeCodes
            .Where(p => p.UserId == userId && p.Status == PasswordChangeCodeStatus.Pending)
            .ToListAsync(ct);

        foreach (var existingCode in existingCodes)
        {
            existingCode.Status = PasswordChangeCodeStatus.ExpiredByNewCode;
        }

        var now = DateTime.UtcNow;
        var code = CryptoUtils.GenerateCode();
        var codeHash = CryptoUtils.ComputeSha256Hash(code);
        var newPasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);

        var passwordChangeCode = new PasswordChangeCode
        {
            Id = Guid.NewGuid(),
            UserId = dbUser.Id,
            CodeHash = codeHash,
            NewPasswordHash = newPasswordHash,
            Status = PasswordChangeCodeStatus.Pending,
            ExpiresAt = now.AddMinutes(10),
            CreatedAt = now
        };

        dbContext.PasswordChangeCodes.Add(passwordChangeCode);
        var cooldownWindow = FloorToWindow(now, TimeSpan.FromMinutes(10));
        var emailHandle = await emailIntentWriter.Add(new EmailIntentAddRequest
        {
            Dedupe = EmailIntentDedupeKey.PasswordChange(dbUser.Id, cooldownWindow),
            MessageType = EmailMessageType.PasswordChangeCode,
            RecipientAddress = dbUser.Email,
            Owner = new EmailIntentOwner(EmailIntentOwnerType.User, dbUser.Id),
            CorrelationId = HttpContext.TraceIdentifier,
            Inputs = new Dictionary<string, string>
            {
                ["NAME"] = dbUser.Name,
                ["CODE"] = code,
                ["EXPIRES_IN"] = "10"
            }
        }, ct);
        await dbContext.SaveChangesAsync(ct);
        emailIntentRelaySignal.Signal();

        await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.PasswordChange, Status = SecurityLogStatus.Warning, UserId = userId, Details = "Código de confirmação enfileirado." });

        await Send.ResponseAsync(new ChangePasswordResponse
        {
            Data = new ChangePasswordData(emailHandle.Id, "Pending"),
            Message = "Código de confirmação enfileirado para envio."
        }, 202, ct);
    }

    private static DateTime FloorToWindow(DateTime utcNow, TimeSpan window)
    {
        var ticks = utcNow.Ticks - (utcNow.Ticks % window.Ticks);
        return new DateTime(ticks, DateTimeKind.Utc);
    }
}
