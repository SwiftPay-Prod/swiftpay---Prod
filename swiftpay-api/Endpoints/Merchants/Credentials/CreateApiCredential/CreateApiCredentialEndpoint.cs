using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Interfaces;
using swiftpay_api.Mappers;

namespace swiftpay_api.Endpoints.Merchants.Credentials.CreateApiCredential;

public sealed class CreateApiCredentialEndpoint(
    PrimaryDbContext dbContext,
    ISecurityLogService securityLog,
    IGeoLocationService geoLocationService,
    IEmailService emailService,
    INotificationService notificationService
) : Endpoint<CreateApiCredentialRequest, CreateApiCredentialResponse>
{
    public override void Configure()
    {
        Post("{merchantId:guid}/api-credentials");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(CreateApiCredentialRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new CreateApiCredentialResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var ipAddress = EndpointUtils.GetIpAddress(HttpContext);

        var geoLocation = await geoLocationService.GetLocationAsync(ipAddress);
        var location = geoLocation.DisplayLocation;

        // Verificar se o merchant pertence ao usuário
        var merchant = await dbContext.Merchants
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new CreateApiCredentialResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        if (merchant.Status != MerchantStatus.Active)
        {
            await Send.ResponseAsync(new CreateApiCredentialResponse
            {
                Error = new("A organização precisa estar ativa para criar credenciais de API.")
            }, 400, ct);
            return;
        }

        var (clientId, clientSecret, clientSecretHash) = CryptoUtils.GenerateApiCredentials(req.Environment.ToString());

        var credentialName = req.Name ?? $"Credencial {req.Environment}";

        var credential = new MerchantApiCredential
        {
            Id = Guid.CreateVersion7(),
            MerchantId = req.MerchantId,
            Name = credentialName,
            ClientId = clientId,
            ClientSecretHash = clientSecretHash,
            Environment = req.Environment,
            Status = MerchantApiCredentialStatus.Active,
            AllowedIpRange = req.AllowedIpRange
        };

        dbContext.MerchantApiCredentials.Add(credential);
        await dbContext.SaveChangesAsync(ct);

        await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.MerchantUpdated, Status = SecurityLogStatus.Success, UserId = userId, Details = $"Credencial de API criada para o merchant {merchant.Id} no ambiente {req.Environment}" });

        var user = await dbContext.Users.OrderBy(u => u.Id).FirstOrDefaultAsync(u => u.Id == userId, ct);

        _ = notificationService.CreateSecurityNotificationAsync(
            req.MerchantId,
            "Nova credencial de API criada",
            $"Uma nova credencial de API foi criada para o ambiente {req.Environment}. Se você não reconhece essa ação, entre em contato com o suporte.",
            NotificationPriority.High
        );

        if (user != null)
        {
            var now = DateTime.UtcNow;
            var brazilTimeZone = TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time");
            var brazilTime = TimeZoneInfo.ConvertTimeFromUtc(now, brazilTimeZone);

            _ = emailService.SendAsync(
                user.Email,
                "🔑 Nova credencial de API criada - SwiftPay",
                EmailTemplate.ApiCredentialCreated,
                new Dictionary<string, string>
                {
                    { "NAME", user.Name },
                    { "CREDENTIAL_NAME", credentialName },
                    { "ENVIRONMENT", req.Environment.ToString() },
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

        await Send.ResponseAsync(new CreateApiCredentialResponse
        {
            Data = ApiCredentialMapper.ToCreateData(credential, clientSecret)
        }, 201, ct);
    }
}
