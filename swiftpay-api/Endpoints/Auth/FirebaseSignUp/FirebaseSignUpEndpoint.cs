using FastEndpoints;
using Microsoft.Extensions.Options;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.Endpoints.Auth.Shared.Models;
using swiftpay_api_core.Utils;
using swiftpay_api.EndpointsGroups;
using swiftpay_api.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Settings;
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
    IGeoLocationService geoLocationService,
    IEmailIntentWriter emailIntentWriter,
    IEmailIntentRelaySignal emailIntentRelaySignal,
    IOptions<PlatformSettingsOptions> platformSettings
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

        var now = DateTime.UtcNow;
        var ipAddress = EndpointUtils.GetIpAddress(HttpContext);
        var userAgent = EndpointUtils.GetUserAgent(HttpContext);
        var geoLocation = await geoLocationService.GetLocationAsync(ipAddress);
        var location = geoLocation.DisplayLocation;
        var deviceId = req.DeviceId ?? Guid.NewGuid().ToString("N");
        var deviceInfo = ExtractDeviceInfo(userAgent);
        var referralCode = await GenerateUniqueReferralCodeAsync(ct);
        var isNewUser = false;
        var queuedVerification = false;
        User user;

        await using (var transaction = await dbContext.Database.BeginTransactionAsync(ct))
        {
            user = await dbContext.Users
                .FirstOrDefaultAsync(candidate => candidate.FirebaseUid == claims.Uid, ct);

            if (user is null)
            {
                var emailExists = await dbContext.Users
                    .AnyAsync(candidate => candidate.Email == emailLower, ct);
                if (emailExists)
                {
                    await transaction.RollbackAsync(ct);
                    await Send.ResponseAsync(new FirebaseSignUpResponse
                    {
                        Error = new("E-mail já está em uso.") { Code = "USER_ALREADY_EXISTS" }
                    }, 409, ct);
                    return;
                }

                user = new User
                {
                    Name = req.Name.Trim(),
                    Email = emailLower,
                    WhatsApp = req.WhatsApp?.Trim(),
                    Password = BCrypt.Net.BCrypt.HashPassword(CryptoUtils.GenerateSecurePassword()),
                    PasswordChangedAt = now,
                    EmailVerified = claims.EmailVerified,
                    FirebaseUid = claims.Uid,
                    FirebaseProvider = claims.SignInProvider,
                    ReferralCode = referralCode,
                    ReferredByUserId = referrerUser?.Id,
                    ReferredAt = referrerUser is not null ? now : null
                };
                dbContext.Users.Add(user);
                await dbContext.SaveChangesAsync(ct);
                isNewUser = true;
            }
            else if (!string.Equals(user.Email, emailLower, StringComparison.OrdinalIgnoreCase))
            {
                await transaction.RollbackAsync(ct);
                await Send.ResponseAsync(new FirebaseSignUpResponse
                {
                    Error = new("A identidade autenticada não corresponde à conta SwiftPay.") { Code = "IDENTITY_CONFLICT" }
                }, 409, ct);
                return;
            }
            user.EmailVerified = user.EmailVerified || claims.EmailVerified;
            user.FirebaseProvider = claims.SignInProvider;

            if (user.ReferredByUserId.HasValue)
            {
                await referralCommissionCompilationService.EnsureReferralLinkStructuresAsync(
                    user.ReferredByUserId.Value,
                    user.Id,
                    ct);
            }

            var deviceExists = await dbContext.TrustedDevices
                .AnyAsync(device => device.UserId == user.Id && device.DeviceId == deviceId, ct);
            if (!deviceExists)
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

            if (!user.EmailVerified)
            {
                await emailIntentWriter.Add(new EmailIntentAddRequest
                {
                    Dedupe = EmailIntentDedupeKey.SignupVerification(claims.Uid, "1"),
                    MessageType = EmailMessageType.EmailConfirmation,
                    RecipientAddress = user.Email,
                    Owner = new EmailIntentOwner(EmailIntentOwnerType.User, user.Id),
                    CorrelationId = HttpContext.TraceIdentifier,
                    Inputs = new Dictionary<string, string>
                    {
                        ["NAME"] = user.Name
                    },
                    AuthAction = new EmailIntentAuthActionRequest
                    {
                        ActionType = EmailAuthActionType.VerifyEmail,
                        FirebaseUid = claims.Uid,
                        ContinueUrl = $"{platformSettings.Value.BaseUrl.TrimEnd('/')}/?auth=signin"
                    }
                }, ct);
                queuedVerification = true;
            }

            await dbContext.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
        }

        if (queuedVerification)
            emailIntentRelaySignal.Signal();

        await securityLog.LogAsync(new SecurityLogInput
        {
            Action = SecurityLogAction.SignUp,
            Status = SecurityLogStatus.Success,
            UserId = user.Id
        });

        if (isNewUser && referrerUser is not null)
            await NotifyReferrerAsync(referrerUser, user);

        if (!user.EmailVerified)
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