using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Interfaces;

namespace swiftpay_api.Endpoints.Users.ConfirmChangePassword;

public sealed class ConfirmChangePasswordEndpoint(
    PrimaryDbContext dbContext,
    IEmailIntentWriter emailIntentWriter,
    IEmailIntentRelaySignal emailIntentRelaySignal,
    ISecurityLogService securityLog,
    IGeoLocationService geoLocationService
) : Endpoint<ConfirmChangePasswordRequest, ConfirmChangePasswordResponse>
{
    public override void Configure()
    {
        Post("confirm-change-password");
        Group<UserGroup>();
    }

    public override async Task HandleAsync(ConfirmChangePasswordRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ConfirmChangePasswordResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var ipAddress = EndpointUtils.GetIpAddress(HttpContext);

        var geoLocation = await geoLocationService.GetLocationAsync(ipAddress);
        var location = geoLocation.DisplayLocation;

        var dbUser = await dbContext.Users
            .OrderBy(u => u.Id)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);

        if (dbUser == null)
        {
            await Send.ResponseAsync(new ConfirmChangePasswordResponse
            {
                Error = new("Usuário não encontrado.")
            }, 404, ct);
            return;
        }

        var codeHash = CryptoUtils.ComputeSha256Hash(req.Code);

        var passwordChangeCode = await dbContext.PasswordChangeCodes
            .Where(p => p.UserId == userId && p.CodeHash == codeHash)
            .OrderByDescending(p => p.CreatedAt)
            .OrderBy(x => x.Id)
            .FirstOrDefaultAsync(ct);

        if (passwordChangeCode == null)
        {
            await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.PasswordChange, Status = SecurityLogStatus.Failed, UserId = userId, Details = "Código de confirmação inválido." });

            await Send.ResponseAsync(new ConfirmChangePasswordResponse
            {
                Error = new("Código de confirmação inválido.")
            }, 400, ct);
            return;
        }

        if (!passwordChangeCode.IsValid)
        {
            var message = passwordChangeCode.IsExpired
                ? "Código de confirmação expirado."
                : "Código de confirmação já utilizado.";

            await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.PasswordChange, Status = SecurityLogStatus.Failed, UserId = userId, Details = message });

            await Send.ResponseAsync(new ConfirmChangePasswordResponse
            {
                Error = new(message)
            }, 400, ct);
            return;
        }

        var now = DateTime.UtcNow;
        var brazilTime = TimeZoneInfo.ConvertTimeFromUtc(now, DateTimeUtils.BrasiliaTimeZone);
        passwordChangeCode.Status = PasswordChangeCodeStatus.Used;
        dbUser.Password = passwordChangeCode.NewPasswordHash;
        dbUser.PasswordChangedAt = now;
        dbUser.UpdatedAt = now;

        var emailHandle = await emailIntentWriter.Add(new EmailIntentAddRequest
        {
            Dedupe = EmailIntentDedupeKey.BusinessTransition(
                EmailMessageType.PasswordChanged,
                dbUser.Id,
                passwordChangeCode.Id),
            MessageType = EmailMessageType.PasswordChanged,
            RecipientAddress = dbUser.Email,
            Owner = new EmailIntentOwner(EmailIntentOwnerType.User, dbUser.Id),
            CorrelationId = HttpContext.TraceIdentifier,
            Inputs = new Dictionary<string, string>
            {
                ["NAME"] = dbUser.Name,
                ["DATE"] = brazilTime.ToString("dd/MM/yyyy"),
                ["TIME"] = brazilTime.ToString("HH:mm:ss"),
                ["IP_ADDRESS"] = ipAddress,
                ["LOCATION"] = location
            }
        }, ct);

        await dbContext.SaveChangesAsync(ct);
        emailIntentRelaySignal.Signal();

        await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.PasswordChange, Status = SecurityLogStatus.Success, UserId = userId, Details = "Senha alterada com sucesso." });

        await Send.OkAsync(new ConfirmChangePasswordResponse
        {
            Data = new ConfirmChangePasswordData(emailHandle.Id, "Pending"),
            Message = "Senha alterada com sucesso. Por motivos de segurança, você foi desconectado de todos os dispositivos."
        }, ct);
    }

}
