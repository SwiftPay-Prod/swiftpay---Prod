using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using swiftpay_api_core.Database;
using swiftpay_api.Endpoints.Auth.Shared.Models;
using swiftpay_api_core.Utils;
using swiftpay_api.EndpointsGroups;
using swiftpay_api.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Models.Settings;
using swiftpay_api_core.Interfaces;
using swiftpay_api.Mappers;

namespace swiftpay_api.Endpoints.Auth.SignIn;

public sealed class SignInEndpoint(
    PrimaryDbContext dbContext,
    ITokenService tokenService,
    ISessionService sessionService,
    ISecurityLogService securityLog,
    IEmailIntentWriter emailIntentWriter,
    IEmailIntentRelaySignal emailIntentRelaySignal,
    IGeoLocationService geoLocationService,
    IOptions<PlatformSettingsOptions> platformSettings
) : Endpoint<SignInRequest, SignInResponse>
{
    public override void Configure()
    {
        Post("signin");
        Group<AuthGroup>();
        AllowAnonymous();
    }

    public override async Task HandleAsync(SignInRequest req, CancellationToken ct)
    {
        var ipAddress = EndpointUtils.GetIpAddress(HttpContext);
        var userAgent = EndpointUtils.GetUserAgent(HttpContext);
        var emailLower = req.Email.ToLower().Trim();
        var now = DateTime.UtcNow;
        var brazilTime = TimeZoneInfo.ConvertTimeFromUtc(now, DateTimeUtils.BrasiliaTimeZone);

        var geoLocation = await geoLocationService.GetLocationAsync(ipAddress);
        var location = geoLocation.DisplayLocation;

        var user = await dbContext.Users
            .OrderBy(u => u.Id)
            .FirstOrDefaultAsync(u => u.Email == emailLower, ct);

        if (user == null)
        {
            await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.SignIn, Status = SecurityLogStatus.Failed, Details = "User not found" });

            await Send.ResponseAsync(new SignInResponse
            {
                Error = new("Credenciais inválidas ou conta bloqueada. Para desbloquear, redefina sua senha!")
            }, 401, ct);
            return;
        }

        if (user.IsLockedOut)
        {
            await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.SignIn, Status = SecurityLogStatus.Failed, UserId = user.Id, Details = "Account permanently locked" });

            await Send.ResponseAsync(new SignInResponse
            {
                Error = new("Credenciais inválidas ou conta bloqueada. Para desbloquear, redefina sua senha.")
            }, 401, ct);
            return;
        }

        if (user.Status != UserStatus.Active)
        {
            await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.SignIn, Status = SecurityLogStatus.Failed, UserId = user.Id, Details = $"Account status: {user.Status}" });

            var statusMessage = user.Status switch
            {
                UserStatus.Inactive => user.InactiveReason ?? "Sua conta está inativa. Entre em contato com o suporte.",
                UserStatus.Suspended => user.SuspendedReason ?? "Sua conta está suspensa. Entre em contato com o suporte.",
                _ => "Conta inativa ou suspensa."
            };

            await Send.ResponseAsync(new SignInResponse
            {
                Error = new(statusMessage)
            }, 401, ct);
            return;
        }

        var passwordValid = BCrypt.Net.BCrypt.Verify(req.Password, user.Password);

        var maxAttempts = platformSettings.Value.MaxLoginAttempts;

        if (!passwordValid)
        {
            user.FailedLoginAttempts++;
            var remainingAttempts = maxAttempts - user.FailedLoginAttempts;

            var details = $"Invalid password. Attempts: {user.FailedLoginAttempts}/{maxAttempts}";
            var action = SecurityLogAction.SignIn;

            if (user.FailedLoginAttempts >= maxAttempts)
            {
                user.IsLockedOut = true;
                user.LockedOutAt = now;
                action = SecurityLogAction.AccountLocked;
                details = $"Account permanently locked after {maxAttempts} failed attempts";

                await emailIntentWriter.Add(new EmailIntentAddRequest
                {
                    Dedupe = EmailIntentDedupeKey.BusinessTransition(
                        EmailMessageType.AccountLocked,
                        user.Id,
                        Guid.NewGuid()),
                    MessageType = EmailMessageType.AccountLocked,
                    RecipientAddress = user.Email,
                    Owner = new EmailIntentOwner(EmailIntentOwnerType.User, user.Id),
                    CorrelationId = HttpContext.TraceIdentifier,
                    Inputs = new Dictionary<string, string>
                    {
                        ["NAME"] = user.Name,
                        ["FAILED_ATTEMPTS"] = maxAttempts.ToString(),
                        ["DATE"] = brazilTime.ToString("dd/MM/yyyy"),
                        ["TIME"] = brazilTime.ToString("HH:mm:ss"),
                        ["IP_ADDRESS"] = ipAddress,
                        ["LOCATION"] = location,
                        ["USER_AGENT"] = userAgent,
                        ["RESET_PASSWORD_URL"] = $"{platformSettings.Value.BaseUrl.TrimEnd('/')}/?auth=forgot-password"
                    }
                }, ct);

                await dbContext.SaveChangesAsync(ct);
                emailIntentRelaySignal.Signal();
                await securityLog.LogAsync(new SecurityLogInput { Action = action, Status = SecurityLogStatus.Failed, UserId = user.Id, Details = details });


                await Send.ResponseAsync(new SignInResponse
                {
                    Error = new($"Conta bloqueada após {maxAttempts} tentativas incorretas. Para desbloquear, redefina sua senha.")
                }, 401, ct);
                return;
            }

            await dbContext.SaveChangesAsync(ct);
            await securityLog.LogAsync(new SecurityLogInput { Action = action, Status = SecurityLogStatus.Failed, UserId = user.Id, Details = details });

            await Send.ResponseAsync(new SignInResponse
            {
                Error = new($"Credenciais inválidas. Tentativas restantes: {remainingAttempts}.")
            }, 401, ct);
            return;
        }

        if (!user.EmailVerified)
        {
            await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.SignIn, Status = SecurityLogStatus.Failed, UserId = user.Id, Details = "Email not verified" });

            await Send.ResponseAsync(new SignInResponse
            {
                Error = new("Verifique seu e-mail antes de entrar. Enviamos um link de confirmação na criação da conta.")
                {
                    Code = "EMAIL_NOT_VERIFIED"
                }
            }, 401, ct);
            return;
        }

        // Password is valid, now check device trust
        var deviceId = req.DeviceId ?? Guid.NewGuid().ToString("N");
        var deviceInfo = ExtractDeviceInfo(userAgent);

        // Check if this is the user's first login ever (no trusted devices)
        var hasTrustedDevices = await dbContext.TrustedDevices
            .AnyAsync(td => td.UserId == user.Id && td.IsActive, ct);

        if (!hasTrustedDevices)
        {
            // First login ever - trust this device automatically
            var newDevice = new TrustedDevice
            {
                UserId = user.Id,
                DeviceId = deviceId,
                DeviceName = deviceInfo.DeviceName,
                Browser = deviceInfo.Browser,
                OperatingSystem = deviceInfo.OperatingSystem,
                LastIpAddress = ipAddress,
                LastLocation = location,
                LastUsedAt = now,
                IsActive = true
            };

            dbContext.TrustedDevices.Add(newDevice);
            await CompleteLoginAsync(user, ipAddress, location, userAgent, now, ct);

            var session = await sessionService.CreateSessionAsync(user, deviceId, ipAddress, userAgent);
            var jwt = tokenService.GenerateToken(session.SessionId, user.Id);

            await Send.OkAsync(new SignInResponse
            {
                Data = new SignInResponseData
                {
                    RequiresDeviceVerification = false,
                    Auth = new AuthResponse
                    {
                        User = UserMapper.ToUserInfo(user),
                        Tokens = new()
                        {
                            AccessToken = jwt.AccessToken,
                            AccessTokenExpiresAt = jwt.ExpiredAt,
                            SessionId = session.SessionId
                        }
                    }
                }
            }, ct);
            return;
        }

        // Check if device is trusted
        var trustedDevice = await dbContext.TrustedDevices
            .OrderBy(td => td.Id)
            .FirstOrDefaultAsync(td => td.UserId == user.Id && td.DeviceId == deviceId && td.IsActive, ct);

        if (trustedDevice != null)
        {
            // Update device info
            trustedDevice.LastIpAddress = ipAddress;
            trustedDevice.LastLocation = location;
            trustedDevice.LastUsedAt = now;
            trustedDevice.DeviceName = deviceInfo.DeviceName;
            trustedDevice.Browser = deviceInfo.Browser;
            trustedDevice.OperatingSystem = deviceInfo.OperatingSystem;

            await CompleteLoginAsync(user, ipAddress, location, userAgent, now, ct);

            var session = await sessionService.CreateSessionAsync(user, deviceId, ipAddress, userAgent);
            var jwt = tokenService.GenerateToken(session.SessionId, user.Id);

            await Send.OkAsync(new SignInResponse
            {
                Data = new SignInResponseData
                {
                    RequiresDeviceVerification = false,
                    Auth = new AuthResponse
                    {
                        User = UserMapper.ToUserInfo(user),
                        Tokens = new()
                        {
                            AccessToken = jwt.AccessToken,
                            AccessTokenExpiresAt = jwt.ExpiredAt,
                            SessionId = session.SessionId
                        }
                    }
                }
            }, ct);
            return;
        }

        // Auto-trust new device (device verification disabled)
        dbContext.TrustedDevices.Add(new TrustedDevice
        {
            UserId = user.Id,
            DeviceId = deviceId,
            DeviceName = deviceInfo.DeviceName,
            Browser = deviceInfo.Browser,
            OperatingSystem = deviceInfo.OperatingSystem,
            LastIpAddress = ipAddress,
            LastLocation = location,
            LastUsedAt = now,
            IsActive = true
        });

        await CompleteLoginAsync(user, ipAddress, location, userAgent, now, ct);

        var autoSession = await sessionService.CreateSessionAsync(user, deviceId, ipAddress, userAgent);
        var autoJwt = tokenService.GenerateToken(autoSession.SessionId, user.Id);

        await Send.OkAsync(new SignInResponse
        {
            Data = new SignInResponseData
            {
                RequiresDeviceVerification = false,
                Auth = new AuthResponse
                {
                    User = UserMapper.ToUserInfo(user),
                    Tokens = new()
                    {
                        AccessToken = autoJwt.AccessToken,
                        AccessTokenExpiresAt = autoJwt.ExpiredAt,
                        SessionId = autoSession.SessionId
                    }
                }
            }
        }, ct);
    }

    private async Task CompleteLoginAsync(User user, string ipAddress, string location, string userAgent, DateTime now, CancellationToken ct)
    {
        user.FailedLoginAttempts = 0;
        user.LastLoginAt = now;
        user.LastLoginIpAddress = ipAddress;
        user.LastLoginUserAgent = userAgent;
        user.LastLoginLocation = location;

        await dbContext.SaveChangesAsync(ct);
        await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.SignIn, Status = SecurityLogStatus.Success, UserId = user.Id });
    }

    private static (string? DeviceName, string? Browser, string? OperatingSystem) ExtractDeviceInfo(string userAgent)
    {
        string? browser = null;
        string? os = null;

        // Extract browser
        if (userAgent.Contains("Chrome") && !userAgent.Contains("Edg"))
            browser = "Chrome";
        else if (userAgent.Contains("Firefox"))
            browser = "Firefox";
        else if (userAgent.Contains("Safari") && !userAgent.Contains("Chrome"))
            browser = "Safari";
        else if (userAgent.Contains("Edg"))
            browser = "Edge";
        else if (userAgent.Contains("Opera") || userAgent.Contains("OPR"))
            browser = "Opera";

        // Extract OS
        if (userAgent.Contains("Windows"))
            os = "Windows";
        else if (userAgent.Contains("Mac OS"))
            os = "macOS";
        else if (userAgent.Contains("Linux") && !userAgent.Contains("Android"))
            os = "Linux";
        else if (userAgent.Contains("Android"))
            os = "Android";
        else if (userAgent.Contains("iPhone") || userAgent.Contains("iPad"))
            os = "iOS";

        var deviceName = browser != null && os != null
            ? $"{browser} no {os}"
            : browser ?? os ?? "Dispositivo desconhecido";

        return (deviceName, browser, os);
    }

}
