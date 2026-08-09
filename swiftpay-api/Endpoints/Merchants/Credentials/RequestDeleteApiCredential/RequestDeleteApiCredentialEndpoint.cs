using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Interfaces;

namespace swiftpay_api.Endpoints.Merchants.Credentials.RequestDeleteApiCredential;

public sealed class RequestDeleteApiCredentialEndpoint(
    PrimaryDbContext dbContext,
    IEmailIntentWriter emailIntentWriter,
    ISecurityLogService securityLog,
    IGeoLocationService geoLocationService
) : Endpoint<RequestDeleteApiCredentialRequest, RequestDeleteApiCredentialResponse>
{
    public override void Configure()
    {
        Post("{merchantId:guid}/api-credentials/{credentialId:guid}/request-delete");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(RequestDeleteApiCredentialRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new RequestDeleteApiCredentialResponse
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
            await Send.ResponseAsync(new RequestDeleteApiCredentialResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var credential = await dbContext.MerchantApiCredentials
            .OrderBy(c => c.Id)
            .FirstOrDefaultAsync(c => c.Id == req.CredentialId && c.MerchantId == req.MerchantId, ct);

        if (credential == null)
        {
            await Send.ResponseAsync(new RequestDeleteApiCredentialResponse
            {
                Error = new("Credencial não encontrada.")
            }, 404, ct);
            return;
        }

        if (credential.Status == MerchantApiCredentialStatus.Revoked)
        {
            await Send.ResponseAsync(new RequestDeleteApiCredentialResponse
            {
                Error = new("Esta credencial já foi revogada.")
            }, 400, ct);
            return;
        }

        var existingCodes = await dbContext.ApiCredentialCodes
            .Where(c => c.CredentialId == req.CredentialId &&
                        c.Action == ApiCredentialCodeAction.Delete &&
                        c.Status == ApiCredentialCodeStatus.Pending)
            .ToListAsync(ct);

        foreach (var existingCode in existingCodes)
        {
            existingCode.Status = ApiCredentialCodeStatus.ExpiredByNewCode;
        }

        var code = CryptoUtils.GenerateCode();
        var codeHash = CryptoUtils.ComputeSha256Hash(code);

        var requestedAt = DateTime.UtcNow;
        var brazilTime = TimeZoneInfo.ConvertTimeFromUtc(requestedAt, DateTimeUtils.BrasiliaTimeZone);

        var apiCredentialCode = new ApiCredentialCode
        {
            Id = Guid.CreateVersion7(),
            MerchantId = merchant.Id,
            UserId = userId.Value,
            CredentialId = credential.Id,
            CodeHash = codeHash,
            Action = ApiCredentialCodeAction.Delete,
            Status = ApiCredentialCodeStatus.Pending,
            ExpiresAt = requestedAt.AddMinutes(10),
            CredentialName = credential.Name,
            CredentialEnvironment = credential.Environment,
            CredentialAllowedIpRange = credential.AllowedIpRange,
            CreatedAt = requestedAt,
            UpdatedAt = requestedAt
        };

        dbContext.ApiCredentialCodes.Add(apiCredentialCode);
        await emailIntentWriter.Add(new EmailIntentAddRequest
        {
            Dedupe = EmailIntentDedupeKey.ApiCredentialCode(
                merchant.Id,
                apiCredentialCode.Id.ToString("N"),
                ApiCredentialCodeAction.Delete.ToString(),
                requestedAt),
            MessageType = EmailMessageType.ApiCredentialCode,
            RecipientAddress = merchant.User.Email,
            Owner = new(EmailIntentOwnerType.Merchant, merchant.Id),
            CorrelationId = HttpContext.TraceIdentifier,
            Inputs = new Dictionary<string, string>
            {
                ["NAME"] = merchant.User.Name,
                ["MERCHANT_NAME"] = merchant.Name ?? "Sua organização",
                ["CREDENTIAL_NAME"] = credential.Name ?? $"Credencial {credential.Environment}",
                ["ENVIRONMENT"] = credential.Environment.ToString(),
                ["CODE"] = code,
                ["EXPIRES_IN"] = "10",
                ["TITLE"] = "Revogar Credencial de API",
                ["TITLE_ICON"] = "🔒",
                ["TITLE_COLOR"] = "#dc2626",
                ["DESCRIPTION"] = "Você solicitou a revogação desta credencial de API. Após confirmar, esta credencial deixará de funcionar permanentemente.",
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
            Details = $"Código de revogação de credencial solicitado para credential {credential.Id}"
        });


        await Send.OkAsync(new RequestDeleteApiCredentialResponse
        {
            Message = "Código de confirmação enviado para seu e-mail. Verifique sua caixa de entrada."
        }, ct);
    }

}
