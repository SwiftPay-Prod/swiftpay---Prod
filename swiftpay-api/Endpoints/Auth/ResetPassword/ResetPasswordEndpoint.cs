using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Utils;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Inputs;
using Microsoft.AspNetCore.SignalR;
using swiftpay_api.Hubs;
using swiftpay_api_core.Constants;

namespace swiftpay_api.Endpoints.Auth.ResetPassword;

public sealed class ResetPasswordEndpoint(
    PrimaryDbContext dbContext,
    IEmailService emailService,
    ISecurityLogService securityLog,
    IGeoLocationService geoLocationService,
    IHubContext<MainHub> authHub
) : Endpoint<ResetPasswordRequest, ResetPasswordResponse>
{
    public override void Configure()
    {
        Post("reset-password");
        Group<AuthGroup>();
        AllowAnonymous();
    }

    public override async Task HandleAsync(ResetPasswordRequest req, CancellationToken ct)
    {
        var emailLower = req.Email.ToLower().Trim();
        var codeHash = CryptoUtils.ComputeSha256Hash(req.Code);
        var ipAddress = EndpointUtils.GetIpAddress(HttpContext);

        var geoLocation = await geoLocationService.GetLocationAsync(ipAddress);
        var location = geoLocation.DisplayLocation;

        var user = await dbContext.Users
            .OrderBy(u => u.Id)
            .FirstOrDefaultAsync(u => u.Email == emailLower, ct);

        if (user == null)
        {
            await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.PasswordResetComplete, Status = SecurityLogStatus.Failed, Details = $"User not found: {emailLower}" });

            await Send.ResponseAsync(new ResetPasswordResponse
            {
                Error = new("Código inválido ou expirado.")
            }, 400, ct);
            return;
        }

        var resetCode = await dbContext.PasswordResetCodes
            .Where(p => p.UserId == user.Id && p.CodeHash == codeHash)
            .OrderByDescending(p => p.CreatedAt)
            .OrderBy(x => x.Id)
            .FirstOrDefaultAsync(ct);

        if (resetCode == null)
        {
            await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.PasswordResetComplete, Status = SecurityLogStatus.Failed, UserId = user.Id, Details = "Invalid reset code" });

            await Send.ResponseAsync(new ResetPasswordResponse
            {
                Error = new("Código inválido ou expirado.")
            }, 400, ct);
            return;
        }

        if (resetCode.IsExpired && resetCode.Status == PasswordResetCodeStatus.Pending)
        {
            resetCode.Status = PasswordResetCodeStatus.ExpiredByTime;
            await dbContext.SaveChangesAsync(ct);
        }

        if (!resetCode.IsValid)
        {
            await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.PasswordResetComplete, Status = SecurityLogStatus.Failed, UserId = user.Id, Details = $"Code expired or already used. Status: {resetCode.Status}" });

            await Send.ResponseAsync(new ResetPasswordResponse
            {
                Error = new("Código inválido ou expirado.")
            }, 400, ct);
            return;
        }

        resetCode.Status = PasswordResetCodeStatus.Used;

        var now = DateTime.UtcNow;
        var brazilTime = TimeZoneInfo.ConvertTimeFromUtc(now, DateTimeUtils.BrasiliaTimeZone);

        user.Password = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
        user.PasswordChangedAt = now;

        var trustedDevices = await dbContext.TrustedDevices
            .Where(td => td.UserId == user.Id && td.IsActive)
            .ToListAsync(ct);

        foreach (var device in trustedDevices)
        {
            device.IsActive = false;
            device.RevokedAt = now;
            device.UpdatedAt = now;
            
            
            await authHub.Clients.Group(SignalRGroups.Device(device.DeviceId)).SendAsync(SignalRMethods.DeviceRevoked, new
            {
                deviceId = device.DeviceId,
                deviceName = device.DeviceName,
                reason = "Dispositivo removido pela recuperação de senha."
            }, ct);
        }

        user.FailedLoginAttempts = 0;
        user.IsLockedOut = false;
        user.LockedOutAt = null;

        await dbContext.SaveChangesAsync(ct);

        if (trustedDevices.Count > 0)
        {
            await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.DeviceRevoked, Status = SecurityLogStatus.Success, UserId = user.Id, Details = $"Revoked {trustedDevices.Count} trusted devices due to password reset" });
        }

        await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.PasswordResetComplete, Status = SecurityLogStatus.Success, UserId = user.Id });

        await SendPasswordChangedEmailAsync(user, ipAddress, location, brazilTime);

        await Send.OkAsync(new ResetPasswordResponse
        {
            Message = "Senha alterada com sucesso."
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
