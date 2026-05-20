using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api.Mappers;
using safefy_api.Models.Settings;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Admin.Acquirers.ReadAcquirer;

public sealed class ReadAcquirerEndpoint(
    PrimaryDbContext dbContext,
    IOptions<PaymentApiSettings> paymentApiSettings
) : Endpoint<ReadAcquirerRequest, ReadAcquirerResponse>
{
    public override void Configure()
    {
        Get("acquirers/{acquirerId:guid}");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ReadAcquirerRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadAcquirerResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var role = EndpointUtils.GetUserRole(User);
        if (role != "God" && role != "Admin")
        {
            await Send.ResponseAsync(new ReadAcquirerResponse
            {
                Error = new("Você não tem permissão para acessar este recurso.")
            }, 403, ct);
            return;
        }

        var acquirer = await dbContext.Acquirers
            .AsNoTracking()
            .OrderBy(a => a.Id)
            .FirstOrDefaultAsync(a => a.Id == req.AcquirerId, ct);

        if (acquirer == null)
        {
            await Send.ResponseAsync(new ReadAcquirerResponse
            {
                Error = new("Adquirente não encontrada.")
            }, 404, ct);
            return;
        }

        var totalMerchants = await dbContext.Merchants
            .AsNoTracking()
            .Where(m => m.MerchantAcquirers.Any(ma => ma.AcquirerId == acquirer.Id))
            .CountAsync(ct);

        var isGod = role == "God";

        await Send.OkAsync(new ReadAcquirerResponse
        {
            Data = AcquirerMapper.ToData(
                acquirer,
                totalMerchants,
                includeSensitiveFields: true,
                includeCredentials: isGod,
                paymentApiBaseUrl: paymentApiSettings.Value.BaseUrl)
        }, ct);
    }
}
