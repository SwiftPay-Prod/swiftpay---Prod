using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Email;
using safefy_api_core.Models.Inputs;
using safefy_api_core.Models.Enum;
using safefy_api_core.Interfaces;
using safefy_api.Mappers;

namespace safefy_api.Endpoints.Merchants.Credentials.ConfirmCreateApiCredential;

public sealed class ConfirmCreateApiCredentialEndpoint(
    PrimaryDbContext dbContext,
    ISecurityLogService securityLog,
    IGeoLocationService geoLocationService,
    IEmailService emailService,
    INotificationService notificationService
) : Endpoint<ConfirmCreateApiCredentialRequest, ConfirmCreateApiCredentialResponse>
{
    public override void Configure()
    {
        Post("{merchantId:guid}/api-credentials/confirm-create");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ConfirmCreateApiCredentialRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ConfirmCreateApiCredentialResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var ipAddress = EndpointUtils.GetIpAddress(HttpContext);
        var geoLocation = await geoLocationService.GetLocationAsync(ipAddress);
        var location = geoLocation.DisplayLocation;

        var merchant = await dbContext.Merchants
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new ConfirmCreateApiCredentialResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        if (merchant.Status != MerchantStatus.Active)
        {
            await Send.ResponseAsync(new ConfirmCreateApiCredentialResponse
            {
                Error = new("A organização precisa estar ativa para criar credenciais de API.")
            }, 400, ct);
            return;
        }

        var codeHash = CryptoUtils.ComputeSha256Hash(req.Code);

        var apiCredentialCode = await dbContext.ApiCredentialCodes
            .OrderBy(c => c.Id)
            .FirstOrDefaultAsync(c =>
                c.MerchantId == req.MerchantId &&
                c.UserId == userId &&
                c.Action == ApiCredentialCodeAction.Create &&
                c.CodeHash == codeHash &&
                c.Status == ApiCredentialCodeStatus.Pending, ct);

        if (apiCredentialCode == null)
        {
            await Send.ResponseAsync(new ConfirmCreateApiCredentialResponse
            {
                Error = new("Código inválido ou expirado.")
            }, 400, ct);
            return;
        }

        if (apiCredentialCode.IsExpired)
        {
            apiCredentialCode.Status = ApiCredentialCodeStatus.ExpiredByTime;
            await dbContext.SaveChangesAsync(ct);

            await Send.ResponseAsync(new ConfirmCreateApiCredentialResponse
            {
                Error = new("Código expirado. Solicite um novo código.")
            }, 400, ct);
            return;
        }

        apiCredentialCode.Status = ApiCredentialCodeStatus.Used;

        var (clientId, clientSecret, clientSecretHash) = CryptoUtils.GenerateApiCredentials(apiCredentialCode.CredentialEnvironment.ToString() ?? "Production");

        var credential = new MerchantApiCredential
        {
            Id = Guid.CreateVersion7(),
            MerchantId = req.MerchantId,
            Name = apiCredentialCode.CredentialName,
            ClientId = clientId,
            ClientSecretHash = clientSecretHash,
            Environment = apiCredentialCode.CredentialEnvironment ?? ApiEnvironment.Production,
            Status = MerchantApiCredentialStatus.Active,
            AllowedIpRange = apiCredentialCode.CredentialAllowedIpRange
        };

        dbContext.MerchantApiCredentials.Add(credential);
        await dbContext.SaveChangesAsync(ct);

        await securityLog.LogAsync(new SecurityLogInput
        {
            Action = SecurityLogAction.MerchantUpdated,
            Status = SecurityLogStatus.Success,
            UserId = userId,
            Details = $"Credencial de API criada para o merchant {merchant.Id} no ambiente {credential.Environment}"
        });

        var user = await dbContext.Users.OrderBy(u => u.Id).FirstOrDefaultAsync(u => u.Id == userId, ct);

        _ = notificationService.CreateSecurityNotificationAsync(
            req.MerchantId,
            "Nova credencial de API criada",
            $"Uma nova credencial de API foi criada para o ambiente {credential.Environment}. Se você não reconhece essa ação, entre em contato com o suporte.",
            NotificationPriority.High
        );

        if (user != null)
        {
            var now = DateTime.UtcNow;
            var brazilTimeZone = TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time");
            var brazilTime = TimeZoneInfo.ConvertTimeFromUtc(now, brazilTimeZone);

            _ = emailService.SendAsync(
                user.Email,
                "🔑 Nova credencial de API criada - Safefy",
                EmailTemplate.ApiCredentialCreated,
                new Dictionary<string, string>
                {
                    { "NAME", user.Name },
                    { "CREDENTIAL_NAME", credential.Name ?? $"Credencial {credential.Environment}" },
                    { "ENVIRONMENT", credential.Environment.ToString() },
                    { "MERCHANT_NAME", merchant.Name ?? "Merchant" },
                    { "DATE", brazilTime.ToString("dd/MM/yyyy") },
                    { "TIME", brazilTime.ToString("HH:mm:ss") },
                    { "IP_ADDRESS", ipAddress },
                    { "LOCATION", location }
                },
                userId: user.Id,
                merchantId: merchant.Id
            );
        }

        await Send.ResponseAsync(new ConfirmCreateApiCredentialResponse
        {
            Data = ApiCredentialMapper.ToCreateData(credential, clientSecret)
        }, 201, ct);
    }
}
