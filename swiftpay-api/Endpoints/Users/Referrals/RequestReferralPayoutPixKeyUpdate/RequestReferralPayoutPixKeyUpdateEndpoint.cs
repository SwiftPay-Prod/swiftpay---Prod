using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Settings;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Users.Referrals.RequestReferralPayoutPixKeyUpdate;

public sealed class RequestReferralPayoutPixKeyUpdateEndpoint(
    PrimaryDbContext dbContext,
    IEmailService emailService,
    IGeoLocationService geoLocationService,
    IOptions<PlatformSettingsOptions> platformSettings
) : EndpointWithoutRequest<RequestReferralPayoutPixKeyUpdateResponse>
{
    public override void Configure()
    {
        Post("referrals/payout-pix-key/request-update");
        Group<UserGroup>();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new RequestReferralPayoutPixKeyUpdateResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var user = await dbContext.Users
            .OrderBy(u => u.Id)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);

        if (user == null)
        {
            await Send.ResponseAsync(new RequestReferralPayoutPixKeyUpdateResponse
            {
                Error = new("Usuário não encontrado.")
            }, 404, ct);
            return;
        }

        var now = DateTime.UtcNow;
        if (user.ReferralPayoutPixKeyVerificationCodeRequestedAt.HasValue
            && user.ReferralPayoutPixKeyVerificationCodeRequestedAt.Value.AddSeconds(30) > now)
        {
            await Send.ResponseAsync(new RequestReferralPayoutPixKeyUpdateResponse
            {
                Error = new("Aguarde alguns segundos para solicitar um novo código.")
            }, 429, ct);
            return;
        }

        var verificationId = Guid.CreateVersion7();
        var code = CryptoUtils.GenerateCode();
        var codeHash = CryptoUtils.ComputeSha256Hash(code);
        var expiresAt = now.AddMinutes(platformSettings.Value.VerificationCodeExpirationMinutes);

        user.ReferralPayoutPixKeyVerificationId = verificationId;
        user.ReferralPayoutPixKeyVerificationCodeHash = codeHash;
        user.ReferralPayoutPixKeyVerificationCodeExpiresAt = expiresAt;
        user.ReferralPayoutPixKeyVerificationCodeRequestedAt = now;
        user.ReferralPayoutPixKeyVerificationCodeFailedAttempts = 0;
        user.UpdatedAt = now;

        await dbContext.SaveChangesAsync(ct);

        var ipAddress = EndpointUtils.GetIpAddress(HttpContext);
        var location = (await geoLocationService.GetLocationAsync(ipAddress)).DisplayLocation;
        var brazilTimeZone = TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time");
        var brazilTime = TimeZoneInfo.ConvertTimeFromUtc(now, brazilTimeZone);

        _ = emailService.SendAsync(
            user.Email,
            "🔐 Código para confirmar chave PIX de indicação - SwiftPay",
            EmailTemplate.ReferralPayoutPixKeyVerification,
            new Dictionary<string, string>
            {
                { "NAME", user.Name },
                { "CODE", code },
                { "DATE", brazilTime.ToString("dd/MM/yyyy") },
                { "TIME", brazilTime.ToString("HH:mm:ss") },
                { "IP_ADDRESS", ipAddress },
                { "LOCATION", location }
            },
            userId: user.Id
        );

        await Send.OkAsync(new RequestReferralPayoutPixKeyUpdateResponse
        {
            Data = new RequestReferralPayoutPixKeyUpdateData
            {
                VerificationId = verificationId,
                ExpiresAt = expiresAt,
                MaskedEmail = MaskEmail(user.Email)
            },
            Message = "Código de verificação enviado para seu e-mail."
        }, ct);
    }

    private static string MaskEmail(string email)
    {
        var parts = email.Split('@');
        if (parts.Length != 2)
        {
            return "***@***.***";
        }

        var local = parts[0];
        var domain = parts[1];

        var maskedLocal = local.Length <= 2
            ? new string('*', local.Length)
            : local[0] + new string('*', local.Length - 2) + local[^1];

        return $"{maskedLocal}@{domain}";
    }
}
