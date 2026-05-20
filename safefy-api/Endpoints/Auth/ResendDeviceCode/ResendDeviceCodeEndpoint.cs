using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Email;
using safefy_api_core.Models.Inputs;
using safefy_api_core.Interfaces;
using safefy_api.Interfaces;

namespace safefy_api.Endpoints.Auth.ResendDeviceCode;

public sealed class ResendDeviceCodeEndpoint(
    PrimaryDbContext dbContext,
    ISecurityLogService securityLog,
    IEmailService emailService
) : Endpoint<ResendDeviceCodeRequest, ResendDeviceCodeResponse>
{
    public override void Configure()
    {
        Post("resend-device-code");
        Group<AuthGroup>();
        AllowAnonymous();
    }

    public override async Task HandleAsync(ResendDeviceCodeRequest req, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var brazilTimeZone = TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time");
        var brazilTime = TimeZoneInfo.ConvertTimeFromUtc(now, brazilTimeZone);

        var existingVerification = await dbContext.DeviceVerificationCodes
            .Include(dvc => dvc.User)
            .OrderBy(dvc => dvc.Id)
            .FirstOrDefaultAsync(dvc => dvc.Id == req.VerificationId, ct);

        if (existingVerification == null)
        {
            await Send.ResponseAsync(new ResendDeviceCodeResponse
            {
                Error = new("Verificação não encontrada. Por favor, faça login novamente.")
            }, 404, ct);
            return;
        }

        if (existingVerification.UsedAt != null)
        {
            await Send.ResponseAsync(new ResendDeviceCodeResponse
            {
                Error = new("Este código já foi utilizado. Por favor, faça login novamente.")
            }, 400, ct);
            return;
        }

        var user = existingVerification.User;
        if (user == null)
        {
            await Send.ResponseAsync(new ResendDeviceCodeResponse
            {
                Error = new("Usuário não encontrado.")
            }, 404, ct);
            return;
        }

        // Mark old verification as used
        existingVerification.UsedAt = now;

        // Generate new verification code
        var code = CryptoUtils.GenerateCode();
        var codeHash = CryptoUtils.ComputeSha256Hash(code);
        var expiresAt = now.AddMinutes(10);

        var newVerification = new DeviceVerificationCode
        {
            UserId = user.Id,
            CodeHash = codeHash,
            DeviceId = existingVerification.DeviceId,
            DeviceName = existingVerification.DeviceName,
            Browser = existingVerification.Browser,
            OperatingSystem = existingVerification.OperatingSystem,
            IpAddress = existingVerification.IpAddress,
            Location = existingVerification.Location,
            UserAgent = existingVerification.UserAgent,
            ExpiresAt = expiresAt
        };

        dbContext.DeviceVerificationCodes.Add(newVerification);
        await dbContext.SaveChangesAsync(ct);

        await securityLog.LogAsync(new SecurityLogInput
        {
            Action = SecurityLogAction.DeviceVerificationCodeResent,
            Status = SecurityLogStatus.Success,
            UserId = user.Id,
            Details = $"Device verification code resent for device {existingVerification.DeviceName}"
        });

        // Send verification email
        await SendDeviceVerificationEmailAsync(user, code, existingVerification.DeviceName ?? "Dispositivo desconhecido", existingVerification.IpAddress, existingVerification.Location, brazilTime);

        await Send.OkAsync(new ResendDeviceCodeResponse
        {
            Data = new ResendDeviceCodeData
            {
                VerificationId = newVerification.Id,
                ExpiresAt = expiresAt
            },
            Message = "Código reenviado com sucesso!"
        }, ct);
    }

    private async Task SendDeviceVerificationEmailAsync(User user, string code, string deviceName, string? ipAddress, string? location, DateTime brazilTime)
    {
        try
        {
            await emailService.SendAsync(
                user.Email,
                "🔐 Código de verificação de dispositivo - Safefy",
                EmailTemplate.DeviceVerification,
                new Dictionary<string, string>
                {
                    { "NAME", user.Name },
                    { "CODE", code },
                    { "DEVICE_NAME", deviceName },
                    { "DATE", brazilTime.ToString("dd/MM/yyyy") },
                    { "TIME", brazilTime.ToString("HH:mm:ss") },
                    { "IP_ADDRESS", ipAddress ?? "Desconhecido" },
                    { "LOCATION", location ?? "Desconhecido" }
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
