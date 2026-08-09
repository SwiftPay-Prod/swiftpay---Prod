using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.Endpoints.Auth.Shared.Models;
using swiftpay_api_core.Utils;
using swiftpay_api.EndpointsGroups;
using swiftpay_api.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Interfaces;
using swiftpay_api.Mappers;
using swiftpay_api_core.Models.Email;

namespace swiftpay_api.Endpoints.Auth.VerifyDevice;

public sealed class VerifyDeviceEndpoint(
    PrimaryDbContext dbContext,
    ITokenService tokenService,
    ISessionService sessionService,
    ISecurityLogService securityLog,
    IEmailIntentWriter emailIntentWriter,
    IEmailIntentRelaySignal emailIntentRelaySignal
) : Endpoint<VerifyDeviceRequest, VerifyDeviceResponse>
{
    public override void Configure()
    {
        Post("verify-device");
        Group<AuthGroup>();
        AllowAnonymous();
    }

    public override async Task HandleAsync(VerifyDeviceRequest req, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var ipAddress = EndpointUtils.GetIpAddress(HttpContext);

        var verification = await dbContext.DeviceVerificationCodes
            .Include(dvc => dvc.User)
            .OrderBy(dvc => dvc.Id)
            .FirstOrDefaultAsync(dvc => dvc.Id == req.VerificationId, ct);

        if (verification == null)
        {
            await Send.ResponseAsync(new VerifyDeviceResponse
            {
                Error = new("Código de verificação não encontrado ou expirado.")
            }, 400, ct);
            return;
        }

        if (!verification.IsValid)
        {
            var reason = verification.IsExpired ? "expirado" : verification.IsUsed ? "já utilizado" : "tentativas excedidas";
            await Send.ResponseAsync(new VerifyDeviceResponse
            {
                Error = new($"Código de verificação {reason}. Faça login novamente para receber um novo código.")
            }, 400, ct);
            return;
        }

        if (verification.DeviceId != req.DeviceId)
        {
            await securityLog.LogAsync(new SecurityLogInput
            {
                Action = SecurityLogAction.SuspiciousLogin,
                Status = SecurityLogStatus.Failed,
                UserId = verification.UserId,
                Details = $"Device ID mismatch during verification. Expected: {verification.DeviceId}, Got: {req.DeviceId}"
            });

            await Send.ResponseAsync(new VerifyDeviceResponse
            {
                Error = new("Dispositivo inválido. Faça login novamente.")
            }, 400, ct);
            return;
        }

        var codeHash = CryptoUtils.ComputeSha256Hash(req.Code);

        if (verification.CodeHash != codeHash)
        {
            verification.FailedAttempts++;
            await dbContext.SaveChangesAsync(ct);

            var remainingAttempts = 5 - verification.FailedAttempts;

            await securityLog.LogAsync(new SecurityLogInput
            {
                Action = SecurityLogAction.SuspiciousLogin,
                Status = SecurityLogStatus.Failed,
                UserId = verification.UserId,
                Details = $"Invalid device verification code. Attempts: {verification.FailedAttempts}/5"
            });

            if (remainingAttempts <= 0)
            {
                await Send.ResponseAsync(new VerifyDeviceResponse
                {
                    Error = new("Código incorreto. Muitas tentativas. Faça login novamente.")
                }, 400, ct);
                return;
            }

            await Send.ResponseAsync(new VerifyDeviceResponse
            {
                Error = new($"Código incorreto. Tentativas restantes: {remainingAttempts}.")
            }, 400, ct);
            return;
        }

        verification.UsedAt = now;

        var user = verification.User;

        if (user.Status != UserStatus.Active)
        {
            await Send.ResponseAsync(new VerifyDeviceResponse
            {
                Error = new("Conta inativa ou suspensa.")
            }, 401, ct);
            return;
        }

        var trustedDevice = new TrustedDevice
        {
            UserId = user.Id,
            DeviceId = verification.DeviceId,
            DeviceName = verification.DeviceName,
            Browser = verification.Browser,
            OperatingSystem = verification.OperatingSystem,
            LastIpAddress = verification.IpAddress ?? ipAddress,
            LastLocation = verification.Location,
            LastUsedAt = now,
            IsActive = true
        };

        dbContext.TrustedDevices.Add(trustedDevice);

        user.FailedLoginAttempts = 0;
        user.LastLoginAt = now;
        user.LastLoginIpAddress = verification.IpAddress ?? ipAddress;
        user.LastLoginUserAgent = verification.UserAgent;
        user.LastLoginLocation = verification.Location;

        await emailIntentWriter.Add(new EmailIntentAddRequest
        {
            Dedupe = EmailIntentDedupeKey.BusinessTransition(
                EmailMessageType.DeviceAdded,
                user.Id,
                verification.Id),
            MessageType = EmailMessageType.DeviceAdded,
            RecipientAddress = user.Email,
            Owner = new EmailIntentOwner(EmailIntentOwnerType.User, user.Id),
            CorrelationId = HttpContext.TraceIdentifier,
            Inputs = new Dictionary<string, string>
            {
                ["name"] = user.Name ?? "Usuário",
                ["device_name"] = verification.DeviceName ?? "Dispositivo",
                ["browser"] = verification.Browser ?? "Desconhecido",
                ["operating_system"] = verification.OperatingSystem ?? "Desconhecido",
                ["ip_address"] = verification.IpAddress ?? ipAddress ?? "Não identificado",
                ["location"] = verification.Location ?? "Desconhecida",
                ["date"] = now.ToString("dd/MM/yyyy 'às' HH:mm")
            }
        }, ct);

        await dbContext.SaveChangesAsync(ct);
        emailIntentRelaySignal.Signal();

        await securityLog.LogAsync(new SecurityLogInput
        {
            Action = SecurityLogAction.SignIn,
            Status = SecurityLogStatus.Success,
            UserId = user.Id,
            Details = $"Device verified and trusted: {verification.DeviceName}"
        });


        var session = await sessionService.CreateSessionAsync(user, verification.DeviceId, verification.IpAddress ?? ipAddress, verification.UserAgent);
        var jwt = tokenService.GenerateToken(session.SessionId, user.Id);

        await Send.OkAsync(new VerifyDeviceResponse
        {
            Data = new AuthResponse
            {
                User = UserMapper.ToUserInfo(user),
                Tokens = new()
                {
                    AccessToken = jwt.AccessToken,
                    AccessTokenExpiresAt = jwt.ExpiredAt,
                    SessionId = session.SessionId
                }
            },
            Message = "Dispositivo verificado com sucesso!"
        }, ct);
    }
}
