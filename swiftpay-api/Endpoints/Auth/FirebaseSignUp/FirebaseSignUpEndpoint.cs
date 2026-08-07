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

namespace swiftpay_api.Endpoints.Auth.FirebaseSignUp;

public sealed class FirebaseSignUpEndpoint(
    PrimaryDbContext dbContext,
    IFirebaseAuthService firebaseAuthService,
    ITokenService tokenService,
    ISessionService sessionService,
    ISecurityLogService securityLog,
    INotificationService notificationService,
    IReferralCommissionCompilationService referralCommissionCompilationService,
    IGeoLocationService geoLocationService
) : Endpoint<FirebaseSignUpRequest, FirebaseSignUpResponse>
{
    public override void Configure()
    {
        Post("firebase-signup");
        Group<AuthGroup>();
        AllowAnonymous();
    }

    public override async Task HandleAsync(FirebaseSignUpRequest req, CancellationToken ct)
    {
        var claims = await firebaseAuthService.VerifyIdTokenAsync(req.IdToken, ct);
        if (claims is null)
        {
            await Send.ResponseAsync(new FirebaseSignUpResponse
            {
                Error = new("Sessão de autenticação inválida ou expirada. Tente novamente.") { Code = "INVALID_ID_TOKEN" }
            }, 401, ct);
            return;
        }

        var emailLower = claims.Email.ToLowerInvariant().Trim();
        var refCode = req.RefCode?.Trim().ToUpperInvariant();

        User? referrerUser = null;
        if (!string.IsNullOrWhiteSpace(refCode))
        {
            referrerUser = await dbContext.Users
                .OrderBy(u => u.Id)
                .FirstOrDefaultAsync(u => u.ReferralCode == refCode, ct);

            if (referrerUser is null || referrerUser.Status != UserStatus.Active)
            {
                await Send.ResponseAsync(new FirebaseSignUpResponse
                {
                    Error = new("Código de indicação inválido.") { Code = "INVALID_REF_CODE" }
                }, 400, ct);
                return;
            }
        }

        // Email-first: single account per email.
        var emailExists = await dbContext.Users
            .AnyAsync(u => u.Email == emailLower, ct);

        if (emailExists)
        {
            await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.SignUp, Status = SecurityLogStatus.Failed, Details = $"Email already in use: {emailLower}" });

            await Send.ResponseAsync(new FirebaseSignUpResponse
            {
                Error = new("E-mail já está em uso.") { Code = "USER_ALREADY_EXISTS" }
            }, 409, ct);
            return;
        }

        var now = DateTime.UtcNow;
        var isGoogle = string.Equals(claims.SignInProvider, "google.com", StringComparison.OrdinalIgnoreCase);
        var emailVerified = claims.EmailVerified;
        var emitsJwt = emailVerified; // email/password unverified => no platform JWT

        var user = new User
        {
            Name = req.Name.Trim(),
            Email = emailLower,
            WhatsApp = req.WhatsApp?.Trim(),
            Password = BCrypt.Net.BCrypt.HashPassword(CryptoUtils.GenerateSecurePassword()),
            PasswordChangedAt = now,
            EmailVerified = emailVerified,
            FirebaseUid = claims.Uid,
            FirebaseProvider = claims.SignInProvider,
            ReferralCode = await GenerateUniqueReferralCodeAsync(ct),
            ReferredByUserId = referrerUser?.Id,
            ReferredAt = referrerUser != null ? now : null
        };

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync(ct);

        if (referrerUser != null)
        {
            await referralCommissionCompilationService.EnsureReferralLinkStructuresAsync(referrerUser.Id, user.Id, ct);
            _ = NotifyReferrerAsync(referrerUser, user);
        }

        var ipAddress = EndpointUtils.GetIpAddress(HttpContext);
        var userAgent = EndpointUtils.GetUserAgent(HttpContext);
        var geoLocation = await geoLocationService.GetLocationAsync(ipAddress);
        var location = geoLocation.DisplayLocation;
        var deviceId = req.DeviceId ?? Guid.NewGuid().ToString("N");

        // Trust the first device (mirrors legacy sign-up/device auto-trust).
        var (deviceName, browser, os) = ExtractDeviceInfo(userAgent);
        dbContext.TrustedDevices.Add(new TrustedDevice
        {
            UserId = user.Id,
            DeviceId = deviceId,
            DeviceName = deviceName,
            Browser = browser,
            OperatingSystem = os,
            LastIpAddress = ipAddress,
            LastLocation = location,
            LastUsedAt = now,
            IsActive = true
        });

        await dbContext.SaveChangesAsync(ct);

        await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.SignUp, Status = SecurityLogStatus.Success, UserId = user.Id });

        // Google provisioning / verified email => issue JWT immediately.
        // Unverified email/password => respond requiresEmailVerification, NO JWT.
        if (!emitsJwt)
        {
            await Send.ResponseAsync(new FirebaseSignUpResponse
            {
                Data = new FirebaseSignUpResponseData { RequiresEmailVerification = true }
            }, 200, ct);
            return;
        }

        var session = await sessionService.CreateSessionAsync(user, deviceId, ipAddress, userAgent);
        var jwt = tokenService.GenerateToken(session.SessionId, user.Id);

        await Send.CreatedAtAsync<FirebaseSignUpEndpoint>(null, new FirebaseSignUpResponse
        {
            Data = new FirebaseSignUpResponseData
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
        }, cancellation: ct);
    }

    private async Task<string> GenerateUniqueReferralCodeAsync(CancellationToken ct)
    {
        for (var attempt = 0; attempt < 10; attempt++)
        {
            var code = $"SFY{Guid.NewGuid():N}"[..12].ToUpperInvariant();
            var exists = await dbContext.Users.AnyAsync(u => u.ReferralCode == code, ct);
            if (!exists)
                return code;
        }
        return $"SFY{Guid.NewGuid():N}".ToUpperInvariant();
    }

    private async Task NotifyReferrerAsync(User referrerUser, User referredUser)
    {
        try
        {
            var title = "Novo cadastro por indicação";
            var message = $"{referredUser.Name} ({referredUser.Email}) se cadastrou usando seu código de indicação.";

            await notificationService.CreateUserInfoNotificationAsync(
                referrerUser.Id,
                title,
                message,
                actionUrl: "/panel/referrals",
                actionLabel: "Ver indicações");
        }
        catch
        {
        }
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