using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Utils;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Inputs;

namespace swiftpay_api.Endpoints.Auth.ForgotPassword;

public sealed class ForgotPasswordEndpoint(
    PrimaryDbContext dbContext,
    IEmailService emailService,
    ISecurityLogService securityLog
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
        var emailLower = req.Email.ToLower().Trim();

        var user = await dbContext.Users
            .OrderBy(u => u.Id)
            .FirstOrDefaultAsync(u => u.Email == emailLower, ct);

        if (user == null)
        {
            await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.PasswordResetRequest, Status = SecurityLogStatus.Failed, Details = $"User not found: {emailLower}" });

            await Send.OkAsync(new ForgotPasswordResponse
            {
                Message = "Se o e-mail estiver cadastrado, você receberá um código de recuperação."
            }, ct);
            return;
        }

        var existingCodes = await dbContext.PasswordResetCodes
            .Where(p => p.UserId == user.Id && p.Status == PasswordResetCodeStatus.Pending)
            .ToListAsync(ct);

        foreach (var existingCode in existingCodes)
        {
            existingCode.Status = PasswordResetCodeStatus.ExpiredByNewCode;
        }

        var code = CryptoUtils.GenerateCode();
        var codeHash = CryptoUtils.ComputeSha256Hash(code);

        var passwordResetCode = new PasswordResetCode
        {
            UserId = user.Id,
            CodeHash = codeHash,
            Status = PasswordResetCodeStatus.Pending,
            ExpiresAt = DateTime.UtcNow.AddMinutes(5),
            CreatedAt = DateTime.UtcNow
        };

        dbContext.PasswordResetCodes.Add(passwordResetCode);
        await dbContext.SaveChangesAsync(ct);

        await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.PasswordResetRequest, Status = SecurityLogStatus.Success, UserId = user.Id });

        await SendPasswordResetCodeEmailAsync(user, code);

        await Send.OkAsync(new ForgotPasswordResponse
        {
            Message = "Se o e-mail estiver cadastrado, você receberá um código de recuperação."
        }, ct);
    }

    private async Task SendPasswordResetCodeEmailAsync(User user, string code)
    {
        try
        {
            await emailService.SendAsync(
                user.Email,
                "Código de recuperação de senha - SwiftPay",
                EmailTemplate.PasswordReset,
                new Dictionary<string, string>
                {
                    { "NAME", user.Name },
                    { "CODE", code },
                    { "EXPIRES_IN", "5" }
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
