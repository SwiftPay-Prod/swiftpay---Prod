using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Interfaces;

namespace swiftpay_api.Endpoints.Merchants.Credentials.RequestCreateApiCredential;

public sealed class RequestCreateApiCredentialEndpoint(
    PrimaryDbContext dbContext,
    IEmailIntentWriter emailIntentWriter,
    ISecurityLogService securityLog,
    IGeoLocationService geoLocationService
) : Endpoint<RequestCreateApiCredentialRequest, RequestCreateApiCredentialResponse>
{
    public override void Configure()
    {
        Post("{merchantId:guid}/api-credentials/request-create");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(RequestCreateApiCredentialRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new RequestCreateApiCredentialResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var ipAddress = EndpointUtils.GetIpAddress(HttpContext);
        var geoLocation = await geoLocationService.GetLocationAsync(ipAddress);
        var location = geoLocation.DisplayLocation;

        var merchant = await dbContext.Merchants
            .Include(m => m.User)
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new RequestCreateApiCredentialResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        if (merchant.Status != MerchantStatus.Active)
        {
            await Send.ResponseAsync(new RequestCreateApiCredentialResponse
            {
                Error = new("A organização precisa estar ativa para criar credenciais de API.")
            }, 400, ct);
            return;
        }

        var existingCodes = await dbContext.ApiCredentialCodes
            .Where(c => c.MerchantId == req.MerchantId &&
                        c.UserId == userId &&
                        c.Action == ApiCredentialCodeAction.Create &&
                        c.Status == ApiCredentialCodeStatus.Pending)
            .ToListAsync(ct);

        foreach (var existingCode in existingCodes)
        {
            existingCode.Status = ApiCredentialCodeStatus.ExpiredByNewCode;
        }

        var code = CryptoUtils.GenerateCode();
        var codeHash = CryptoUtils.ComputeSha256Hash(code);
        var credentialName = req.Name ?? $"Credencial {req.Environment}";

        var requestedAt = DateTime.UtcNow;
        var brazilTime = TimeZoneInfo.ConvertTimeFromUtc(requestedAt, DateTimeUtils.BrasiliaTimeZone);

        var apiCredentialCode = new ApiCredentialCode
        {
            Id = Guid.CreateVersion7(),
            MerchantId = merchant.Id,
            UserId = userId.Value,
            CredentialId = null,
            CodeHash = codeHash,
            Action = ApiCredentialCodeAction.Create,
            Status = ApiCredentialCodeStatus.Pending,
            ExpiresAt = requestedAt.AddMinutes(10),
            CredentialName = credentialName,
            CredentialEnvironment = req.Environment,
            CredentialAllowedIpRange = req.AllowedIpRange,
            CreatedAt = requestedAt,
            UpdatedAt = requestedAt
        };

        dbContext.ApiCredentialCodes.Add(apiCredentialCode);
        await emailIntentWriter.Add(new EmailIntentAddRequest
        {
            Dedupe = EmailIntentDedupeKey.ApiCredentialCode(
                merchant.Id,
                apiCredentialCode.Id.ToString("N"),
                ApiCredentialCodeAction.Create.ToString(),
                requestedAt),
            MessageType = EmailMessageType.ApiCredentialCode,
            RecipientAddress = merchant.User.Email,
            Owner = new(EmailIntentOwnerType.Merchant, merchant.Id),
            CorrelationId = HttpContext.TraceIdentifier,
            Inputs = new Dictionary<string, string>
            {
                ["NAME"] = merchant.User.Name,
                ["MERCHANT_NAME"] = merchant.Name ?? "Sua organização",
                ["CREDENTIAL_NAME"] = credentialName,
                ["ENVIRONMENT"] = req.Environment.ToString(),
                ["CODE"] = code,
                ["EXPIRES_IN"] = "10",
                ["TITLE"] = "Criar Credencial de API",
                ["TITLE_ICON"] = "🔑",
                ["TITLE_COLOR"] = "#2563eb",
                ["DESCRIPTION"] = "Você solicitou a criação de uma nova credencial de API.",
                ["DATE"] = brazilTime.ToString("dd/MM/yyyy"),
                ["TIME"] = brazilTime.ToString("HH:mm:ss"),
                ["IP_ADDRESS"] = ipAddress,
                ["LOCATION"] = location
            }
        }, ct);

        await dbContext.SaveChangesAsync(ct);

        await securityLog.LogAsync(new SecurityLogInput
        {
            Action = SecurityLogAction.MerchantUpdated,
            Status = SecurityLogStatus.Warning,
            UserId = userId,
            Details = $"Código de criação de credencial solicitado para merchant {merchant.Id}"
        });


        await Send.OkAsync(new RequestCreateApiCredentialResponse
        {
            Message = "Código de confirmação enviado para seu e-mail. Verifique sua caixa de entrada."
        }, ct);
    }

}
