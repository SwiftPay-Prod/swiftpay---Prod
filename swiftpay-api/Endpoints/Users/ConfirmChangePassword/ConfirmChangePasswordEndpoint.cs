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
    IEmailService emailService,
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

        passwordChangeCode.Status = PasswordChangeCodeStatus.Used;
        dbUser.Password = passwordChangeCode.NewPasswordHash;
        dbUser.PasswordChangedAt = DateTime.UtcNow;
        dbUser.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(ct);

        await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.PasswordChange, Status = SecurityLogStatus.Success, UserId = userId, Details = "Senha alterada com sucesso." });

        var now = DateTime.UtcNow;
        var brazilTimeZone = TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time");
        var brazilTime = TimeZoneInfo.ConvertTimeFromUtc(now, brazilTimeZone);

        await SendPasswordChangedEmailAsync(dbUser, ipAddress, location, brazilTime);

        await Send.OkAsync(new ConfirmChangePasswordResponse
        {
            Message = "Senha alterada com sucesso. Por motivos de segurança, você foi desconectado de todos os dispositivos."
        }, ct);
    }

    private async Task SendPasswordChangedEmailAsync(User user, string ipAddress, string location, DateTime brazilTime)
    {
        try
        {
            await emailService.SendAsync(
                user.Email,
                "Sua senha foi alterada - SwiftPay",
                EmailTemplate.PasswordChanged,
                new Dictionary<string, string>
                {
                    { "NAME", user.Name },
                    { "DATE", brazilTime.ToString("dd/MM/yyyy") },
                    { "TIME", brazilTime.ToString("HH:mm:ss") },
                    { "IP_ADDRESS", ipAddress },
                    { "LOCATION", location }
                },
                userId: user.Id
            );
        }
        catch
        {
            // Don't fail the request if email fails
        }
    }
}
