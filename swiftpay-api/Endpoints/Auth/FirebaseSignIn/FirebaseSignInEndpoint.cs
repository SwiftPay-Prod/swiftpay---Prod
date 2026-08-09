using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.Endpoints.Auth.Shared.Models;
using swiftpay_api_core.Utils;
using swiftpay_api.EndpointsGroups;
using swiftpay_api.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api.Mappers;

namespace swiftpay_api.Endpoints.Auth.FirebaseSignIn;

public sealed class FirebaseSignInEndpoint(
    PrimaryDbContext dbContext,
    IFirebaseAuthService firebaseAuthService,
    ITokenService tokenService,
    ISessionService sessionService,
    ISecurityLogService securityLog,
    IGeoLocationService geoLocationService
) : Endpoint<FirebaseSignInRequest, FirebaseSignInResponse>
{
    public override void Configure()
    {
        Post("firebase-signin");
        Group<AuthGroup>();
        AllowAnonymous();
    }

    public override async Task HandleAsync(FirebaseSignInRequest req, CancellationToken ct)
    {
        var ipAddress = EndpointUtils.GetIpAddress(HttpContext);
        var userAgent = EndpointUtils.GetUserAgent(HttpContext);
        var now = DateTime.UtcNow;

        var geoLocation = await geoLocationService.GetLocationAsync(ipAddress);
        var location = geoLocation.DisplayLocation;

        var claims = await firebaseAuthService.VerifyIdTokenAsync(req.IdToken, ct);
        if (claims is null)
        {
            await securityLog.LogAsync(new SecurityLogInput
            {
                Action = SecurityLogAction.SignIn,
                Status = SecurityLogStatus.Failed,
                Details = "Firebase ID token invalid"
            });

            await Send.ResponseAsync(new FirebaseSignInResponse
            {
                Error = new("Sessão de autenticação inválida ou expirada. Tente novamente.") { Code = "INVALID_ID_TOKEN" }
            }, 401, ct);
            return;
        }

        // Email-first: resolve the platform account by email (single identity per email).
        var emailLower = claims.Email.ToLowerInvariant().Trim();
        var user = await dbContext.Users
            .OrderBy(u => u.Id)
            .FirstOrDefaultAsync(u => u.Email == emailLower, ct);

        if (user is null)
        {
            await securityLog.LogAsync(new SecurityLogInput
            {
                Action = SecurityLogAction.SignIn,
                Status = SecurityLogStatus.Failed,
                Details = "Firebase sign-in user not found"
            });

            await Send.ResponseAsync(new FirebaseSignInResponse
            {
                Error = new("Conta não encontrada. Verifique seu e-mail ou crie uma conta.") { Code = "USER_NOT_FOUND" }
            }, 401, ct);
            return;
        }

        if (user.IsLockedOut)
        {
            await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.SignIn, Status = SecurityLogStatus.Failed, UserId = user.Id, Details = "Account permanently locked" });

            await Send.ResponseAsync(new FirebaseSignInResponse
            {
                Error = new("Credenciais inválidas ou conta bloqueada. Para desbloquear, redefina sua senha.") { Code = "ACCOUNT_LOCKED" }
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

            await Send.ResponseAsync(new FirebaseSignInResponse
            {
                Error = new(statusMessage) { Code = "ACCOUNT_INACTIVE" }
            }, 401, ct);
            return;
        }

        // Password users may be verified either by Firebase or by SwiftPay's
        // signed confirmation link delivered through the transactional email provider.
        var emailVerified = claims.EmailVerified || user.EmailVerified;
        if (string.Equals(claims.SignInProvider, "password", StringComparison.OrdinalIgnoreCase) && !emailVerified)
        {
            await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.SignIn, Status = SecurityLogStatus.Failed, UserId = user.Id, Details = "Email not verified (password provider)" });

            await Send.ResponseAsync(new FirebaseSignInResponse
            {
                Error = new("Verifique seu e-mail para continuar.") { Code = "EMAIL_NOT_VERIFIED" },
                Data = new FirebaseSignInResponseData { RequiresEmailVerification = true }
            }, 403, ct);
            return;
        }

        // Sync identity idempotently + last login info
        user.FirebaseUid = claims.Uid;
        user.FirebaseProvider = claims.SignInProvider;
        user.EmailVerified = emailVerified;
        user.FailedLoginAttempts = 0;
        user.LastLoginAt = now;
        user.LastLoginIpAddress = ipAddress;
        user.LastLoginUserAgent = userAgent;
        user.LastLoginLocation = location;

        await dbContext.SaveChangesAsync(ct);

        // Trusted device (auto-trust, mirrors legacy sign-in behavior)
        var deviceId = req.DeviceId ?? Guid.NewGuid().ToString("N");
        var deviceInfo = ExtractDeviceInfo(userAgent);

        var trustedDevice = await dbContext.TrustedDevices
            .OrderBy(td => td.Id)
            .FirstOrDefaultAsync(td => td.UserId == user.Id && td.DeviceId == deviceId && td.IsActive, ct);

        if (trustedDevice is null)
        {
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
        }
        else
        {
            trustedDevice.LastIpAddress = ipAddress;
            trustedDevice.LastLocation = location;
            trustedDevice.LastUsedAt = now;
        }

        await dbContext.SaveChangesAsync(ct);

        await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.SignIn, Status = SecurityLogStatus.Success, UserId = user.Id });

        var session = await sessionService.CreateSessionAsync(user, deviceId, ipAddress, userAgent);
        var jwt = tokenService.GenerateToken(session.SessionId, user.Id);

        await Send.OkAsync(new FirebaseSignInResponse
        {
            Data = new FirebaseSignInResponseData
            {
                RequiresEmailVerification = false,
                Auth = new AuthResponse
                {
                    User = UserMapper.ToUserInfo(user),
                    Tokens = new AuthTokens
                    {
                        AccessToken = jwt.AccessToken,
                        AccessTokenExpiresAt = jwt.ExpiredAt,
                        SessionId = session.SessionId
                    }
                }
            }
        }, ct);
    }

    private static (string DeviceName, string? Browser, string? OperatingSystem) ExtractDeviceInfo(string userAgent)
    {
        string? browser = null;
        string? os = null;

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