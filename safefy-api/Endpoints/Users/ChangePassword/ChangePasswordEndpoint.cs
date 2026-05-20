using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Email;
using safefy_api_core.Models.Inputs;
using safefy_api_core.Interfaces;

namespace safefy_api.Endpoints.Users.ChangePassword;

public sealed class ChangePasswordEndpoint(
    PrimaryDbContext dbContext,
    IEmailService emailService,
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

        var code = CryptoUtils.GenerateCode();
        var codeHash = CryptoUtils.ComputeSha256Hash(code);
        var newPasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);

        var passwordChangeCode = new PasswordChangeCode
        {
            UserId = dbUser.Id,
            CodeHash = codeHash,
            NewPasswordHash = newPasswordHash,
            Status = PasswordChangeCodeStatus.Pending,
            ExpiresAt = DateTime.UtcNow.AddMinutes(10),
            CreatedAt = DateTime.UtcNow
        };

        dbContext.PasswordChangeCodes.Add(passwordChangeCode);
        await dbContext.SaveChangesAsync(ct);

        await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.PasswordChange, Status = SecurityLogStatus.Warning, UserId = userId, Details = "Código de confirmação enviado." });

        await SendPasswordChangeCodeEmailAsync(dbUser, code);

        await Send.OkAsync(new ChangePasswordResponse
        {
            Message = "Código de confirmação enviado para seu e-mail."
        }, ct);
    }

    private async Task SendPasswordChangeCodeEmailAsync(User user, string code)
    {
        try
        {
            await emailService.SendAsync(
                user.Email,
                "Código de confirmação de alteração de senha - Safefy",
                EmailTemplate.PasswordChangeCode,
                new Dictionary<string, string>
                {
                    { "NAME", user.Name },
                    { "CODE", code },
                    { "EXPIRES_IN", "10" }
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
