using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api.Mappers;
using safefy_api.Models.Settings;
using safefy_api_core.Models.Acquirer;
using safefy_api_core.Models.Database;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Admin.Acquirers.ResetCredentialSchema;

public sealed class ResetCredentialSchemaEndpoint(
    PrimaryDbContext dbContext,
    IOptions<PaymentApiSettings> paymentApiSettings
) : EndpointWithoutRequest<ResetCredentialSchemaResponse>
{
    public override void Configure()
    {
        Post("acquirers/{acquirerId:guid}/credentials/schema/reset");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var acquirerId = Route<Guid>("acquirerId");
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ResetCredentialSchemaResponse
            {
                Error = new("Token invalido.")
            }, 401, ct);
            return;
        }

        var role = EndpointUtils.GetUserRole(User);
        if (role != "God")
        {
            await Send.ResponseAsync(new ResetCredentialSchemaResponse
            {
                Error = new("Apenas usuarios com cargo God podem resetar o schema de credenciais.")
            }, 403, ct);
            return;
        }

        var acquirer = await dbContext.Acquirers
            .OrderBy(a => a.Id)
            .FirstOrDefaultAsync(a => a.Id == acquirerId, ct);

        if (acquirer == null)
        {
            await Send.ResponseAsync(new ResetCredentialSchemaResponse
            {
                Error = new("Adquirente nao encontrada.")
            }, 404, ct);
            return;
        }

        var schema = BuildDefaultSchema(acquirer.Type);
        if (schema == null)
        {
            await Send.ResponseAsync(new ResetCredentialSchemaResponse
            {
                Error = new("Nao foi encontrado um schema padrao para esta adquirente.")
            }, 400, ct);
            return;
        }

        acquirer.CredentialSchema = schema;
        acquirer.DefaultCredentials = null;
        acquirer.DefaultCredentialsSandbox = null;
        acquirer.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(ct);

        var totalMerchants = await dbContext.Merchants
            .AsNoTracking()
            .Where(m => m.MerchantAcquirers.Any(ma => ma.AcquirerId == acquirer.Id))
            .CountAsync(ct);

        await Send.OkAsync(new ResetCredentialSchemaResponse
        {
            Data = AcquirerMapper.ToData(
                acquirer,
                totalMerchants,
                includeSensitiveFields: true,
                includeCredentials: true,
                paymentApiBaseUrl: paymentApiSettings.Value.BaseUrl),
            Message = "Schema de credenciais resetado com sucesso."
        }, ct);
    }

    private static string? BuildDefaultSchema(AcquirerType type)
    {
        return type switch
        {
            AcquirerType.Bankizi => CredentialUtils.BuildSchema(
                ("clientId", "Client ID", CredentialFieldType.Text, true, "Ex: cli_...", "Client ID fornecido pela Bankizi"),
                ("clientSecret", "Client Secret", CredentialFieldType.Password, true, "Ex: sec_...", "Client Secret fornecido pela Bankizi")
            ),
            AcquirerType.IHubBanking => CredentialUtils.BuildSchema(
                ("secretKey", "Secret Key", CredentialFieldType.Password, true, "Ex: sk_...", "Secret Key fornecida pelo IHub Banking")
            ),
            AcquirerType.ActivePayments => CredentialUtils.BuildSchema(
                ("publicKey", "Public Key", CredentialFieldType.Text, true, "Ex: pk_...", "Chave publica fornecida pela ActivePayments"),
                ("secretKey", "Secret Key", CredentialFieldType.Password, true, "Ex: sk_...", "Chave secreta fornecida pela ActivePayments")
            ),
            AcquirerType.Rapdyn => CredentialUtils.BuildSchema(
                ("token", "Token", CredentialFieldType.Password, true, "Ex: tok_...", "Token de autenticacao fornecido pela Rapdyn")
            ),
            AcquirerType.Coldfy => CredentialUtils.BuildSchema(
                ("secretKey", "Secret Key", CredentialFieldType.Password, true, "Ex: sk_...", "Secret Key fornecida pela Coldfy"),
                ("companyId", "Company ID", CredentialFieldType.Text, true, "Ex: 12345", "ID da empresa na Coldfy")
            ),
            AcquirerType.Pluggou => CredentialUtils.BuildSchema(
                ("publicKey", "Public Key", CredentialFieldType.Text, true, "Ex: pk_...", "Chave publica fornecida pela Pluggou"),
                ("secretKey", "Secret Key", CredentialFieldType.Password, true, "Ex: sk_...", "Chave secreta fornecida pela Pluggou")
            ),
            AcquirerType.HunterPay => CredentialUtils.BuildSchema(
                ("apiKey", "API Key", CredentialFieldType.Password, true, "Ex: hp_live_...", "API Key fornecida pela HunterPay"),
                ("companyId", "Company ID", CredentialFieldType.Text, false, "Ex: 12345", "Company ID da HunterPay usado como password no Basic Auth para saque, quando exigido")
            ),
            _ => null
        };
    }
}
