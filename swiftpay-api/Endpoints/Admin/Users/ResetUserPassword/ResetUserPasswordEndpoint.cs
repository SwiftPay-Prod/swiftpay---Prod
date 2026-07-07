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
    IEmailService emailService
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

        await dbContext.SaveChangesAsync(ct);

        // Send email with temporary password
        try
        {
            await emailService.SendAsync(
                dbUser.Email,
                "Sua senha foi redefinida - SwiftPay",
                EmailTemplate.AdminPasswordReset,
                new Dictionary<string, string>
                {
                    { "NAME", dbUser.Name },
                    { "TEMPORARY_PASSWORD", temporaryPassword }
                },
                userId: dbUser.Id
            );
        }
        catch
        {
            // Don't fail if email fails
        }

        await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.PasswordResetComplete, Status = SecurityLogStatus.Success, UserId = adminId, Details = $"Senha do usuário {dbUser.Id} resetada pelo admin." });

        await Send.OkAsync(new ResetUserPasswordResponse
        {
            Data = new ResetUserPasswordData(temporaryPassword)
        }, ct);
    }
}
