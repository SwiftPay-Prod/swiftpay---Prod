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

namespace swiftpay_api.Endpoints.Auth.SignUp;

public sealed class SignUpEndpoint(
    PrimaryDbContext dbContext,
    ITokenService tokenService,
    ISessionService sessionService,
    ISecurityLogService securityLog,
    IEmailService emailService,
    INotificationService notificationService,
    IReferralCommissionCompilationService referralCommissionCompilationService,
    IOptions<PlatformSettingsOptions> platformSettings,
    IGeoLocationService geoLocationService
) : Endpoint<SignUpRequest, SignUpResponse>
{
    public override void Configure()
    {
        Post("signup");
        Group<AuthGroup>();
        AllowAnonymous();
    }

    public override async Task HandleAsync(SignUpRequest req, CancellationToken ct)
    {
        var emailLower = req.Email.ToLower().Trim();
        var refCode = req.RefCode?.Trim().ToUpperInvariant();

        User? referrerUser = null;
        if (!string.IsNullOrWhiteSpace(refCode))
        {
            referrerUser = await dbContext.Users
                .OrderBy(u => u.Id)
                .FirstOrDefaultAsync(u => u.ReferralCode == refCode, ct);

            if (referrerUser == null)
            {
                await Send.ResponseAsync(new SignUpResponse
                {
                    Error = new("Código de indicação inválido.")
                }, 400, ct);
                return;
            }

            if (referrerUser.Status != UserStatus.Active)
            {
                await Send.ResponseAsync(new SignUpResponse
                {
                    Error = new("Código de indicação indisponível no momento.")
                }, 400, ct);
                return;
            }
        }

        var emailExists = await dbContext.Users
            .AnyAsync(u => u.Email == emailLower, ct);

        if (emailExists)
        {
            await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.SignUp, Status = SecurityLogStatus.Failed, Details = $"Email already in use: {emailLower}" });

            await Send.ResponseAsync(new SignUpResponse
            {
                Error = new("E-mail já está em uso.")
            }, 400, ct);
            return;
        }

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(req.Password);

        var user = new User
        {
            Name = req.Name.Trim(),
            Email = emailLower,
            WhatsApp = req.WhatsApp.Trim(),
            Password = passwordHash,
            PasswordChangedAt = DateTime.UtcNow,
            LastLoginAt = DateTime.UtcNow,
            ReferralCode = await GenerateUniqueReferralCodeAsync(ct),
            ReferredByUserId = referrerUser?.Id,
            ReferredAt = referrerUser != null ? DateTime.UtcNow : null
        };

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync(ct);

        if (referrerUser != null)
        {
            await referralCommissionCompilationService.EnsureReferralLinkStructuresAsync(
                referrerUser.Id,
                user.Id,
                ct);
        }

        var token = CryptoUtils.GenerateToken();
        var tokenHash = CryptoUtils.ComputeSha256Hash(token);
        var expiresInHours = 24;

        var confirmationToken = new EmailConfirmationToken
        {
            UserId = user.Id,
            TokenHash = tokenHash,
            Status = EmailConfirmationTokenStatus.Pending,
            ExpiresAt = DateTime.UtcNow.AddHours(expiresInHours),
            CreatedAt = DateTime.UtcNow
        };

        dbContext.EmailConfirmationTokens.Add(confirmationToken);

        var ipAddress = EndpointUtils.GetIpAddress(HttpContext);
        var geoLocation = await geoLocationService.GetLocationAsync(ipAddress);
        var location = geoLocation.DisplayLocation;
        var userAgent = EndpointUtils.GetUserAgent(HttpContext);

        CurrentDeviceData? currentDevice = null;
        string? deviceId = null;

        if (!string.IsNullOrEmpty(req.DeviceId))
        {
            var (deviceName, browser, os) = ExtractDeviceInfo(userAgent);

            var trustedDevice = new TrustedDevice
            {
                UserId = user.Id,
                DeviceId = req.DeviceId,
                DeviceName = deviceName,
                Browser = browser,
                OperatingSystem = os,
                LastIpAddress = ipAddress,
                LastLocation = location,
                LastUsedAt = DateTime.UtcNow
            };

            dbContext.TrustedDevices.Add(trustedDevice);
            deviceId = req.DeviceId;

            currentDevice = new CurrentDeviceData
            {
                DeviceId = req.DeviceId,
                DeviceName = deviceName
            };

            await securityLog.LogAsync(new SecurityLogInput
            {
                Action = SecurityLogAction.DeviceVerified,
                Status = SecurityLogStatus.Success,
                UserId = user.Id,
                Details = $"First device auto-trusted on signup: {deviceName}"
            });
        }

        await dbContext.SaveChangesAsync(ct);

        await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.SignUp, Status = SecurityLogStatus.Success, UserId = user.Id });

        if (referrerUser != null)
        {
            _ = NotifyReferrerAsync(referrerUser, user);
        }

        var baseUrl = platformSettings.Value.BaseUrl.TrimEnd('/');
        var confirmationUrl = $"{baseUrl}/confirm-email?token={token}&email={Uri.EscapeDataString(user.Email)}";

        await SendEmailConfirmationAsync(user, confirmationUrl, expiresInHours);

        var effectiveDeviceId = deviceId ?? req.DeviceId ?? Guid.NewGuid().ToString("N");
        var session = await sessionService.CreateSessionAsync(user, effectiveDeviceId, ipAddress, userAgent);
        var jwt = tokenService.GenerateToken(session.SessionId, user.Id);

        await Send.CreatedAtAsync<SignUpEndpoint>(null, new SignUpResponse
        {
            Data = new SignUpResponseData
            {
                RequiresDeviceVerification = false,
                User = UserMapper.ToUserInfo(user),
                Tokens = new AuthTokens
                {
                    AccessToken = jwt.AccessToken,
                    AccessTokenExpiresAt = jwt.ExpiredAt,
                    SessionId = session.SessionId
                },
                CurrentDevice = currentDevice
            }
        }, cancellation: ct);
    }

    private async Task<string> GenerateUniqueReferralCodeAsync(CancellationToken ct)
    {
        for (var attempt = 0; attempt < 10; attempt++)
        {
            var code = $"SFY{Guid.NewGuid():N}"[..12].ToUpperInvariant();

            var exists = await dbContext.Users
                .AnyAsync(u => u.ReferralCode == code, ct);

            if (!exists)
            {
                return code;
            }
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

    private static (string DeviceName, string Browser, string Os) ExtractDeviceInfo(string userAgent)
    {
        var browser = "Unknown Browser";
        var os = "Unknown OS";

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

        return ($"{browser} on {os}", browser, os);
    }

    private async Task SendEmailConfirmationAsync(User user, string confirmationUrl, int expiresInHours)
    {
        try
        {
            await emailService.SendAsync(
                user.Email,
                "Confirme seu e-mail - Safefy",
                EmailTemplate.EmailConfirmation,
                new Dictionary<string, string>
                {
                    { "NAME", user.Name },
                    { "CONFIRMATION_URL", confirmationUrl },
                    { "EXPIRES_IN", expiresInHours.ToString() }
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
