using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Interfaces;
using swiftpay_api.Interfaces;

namespace swiftpay_api.Endpoints.Auth.ResendDeviceCode;

public sealed class ResendDeviceCodeEndpoint(
    PrimaryDbContext dbContext,
    ISecurityLogService securityLog,
    IEmailIntentWriter emailIntentWriter,
    IEmailIntentRelaySignal emailIntentRelaySignal
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
        var brazilTime = TimeZoneInfo.ConvertTimeFromUtc(now, DateTimeUtils.BrasiliaTimeZone);

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
            Id = Guid.NewGuid(),
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
        var cooldownWindow = FloorToWindow(now, TimeSpan.FromMinutes(10));
        await emailIntentWriter.Add(new EmailIntentAddRequest
        {
            Dedupe = EmailIntentDedupeKey.DeviceVerification(user.Id, newVerification.DeviceId, cooldownWindow),
            MessageType = EmailMessageType.DeviceVerification,
            RecipientAddress = user.Email,
            Owner = new EmailIntentOwner(EmailIntentOwnerType.User, user.Id),
            CorrelationId = HttpContext.TraceIdentifier,
            Inputs = new Dictionary<string, string>
            {
                ["NAME"] = user.Name,
                ["CODE"] = code,
                ["DEVICE_NAME"] = existingVerification.DeviceName ?? "Dispositivo desconhecido",
                ["DATE"] = brazilTime.ToString("dd/MM/yyyy"),
                ["TIME"] = brazilTime.ToString("HH:mm:ss"),
                ["IP_ADDRESS"] = existingVerification.IpAddress ?? "Desconhecido",
                ["LOCATION"] = existingVerification.Location ?? "Desconhecido"
            }
        }, ct);
        await dbContext.SaveChangesAsync(ct);
        emailIntentRelaySignal.Signal();

        await securityLog.LogAsync(new SecurityLogInput
        {
            Action = SecurityLogAction.DeviceVerificationCodeResent,
            Status = SecurityLogStatus.Success,
            UserId = user.Id,
            Details = $"Device verification code resent for device {existingVerification.DeviceName}"
        });

        await Send.ResponseAsync(new ResendDeviceCodeResponse
        {
            Data = new ResendDeviceCodeData
            {
                VerificationId = newVerification.Id,
                ExpiresAt = expiresAt
            },
            Message = "Código reenviado com sucesso!"
        }, 202, ct);
    }

    private static DateTime FloorToWindow(DateTime utcNow, TimeSpan window)
    {
        var ticks = utcNow.Ticks - (utcNow.Ticks % window.Ticks);
        return new DateTime(ticks, DateTimeKind.Utc);
    }
}
