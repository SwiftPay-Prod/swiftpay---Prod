using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;
using safefy_api_core.Models.Acquirer;

namespace safefy_api.Endpoints.Admin.Acquirers.ReadAcquirerRequiredFields;

public sealed class ReadAcquirerRequiredFieldsEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadAcquirerRequiredFieldsRequest, ReadAcquirerRequiredFieldsResponse>
{
    public override void Configure()
    {
        Get("acquirers/{acquirerId:guid}/required-fields");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ReadAcquirerRequiredFieldsRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadAcquirerRequiredFieldsResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var acquirer = await dbContext.Acquirers
            .AsNoTracking()
            .OrderBy(a => a.Id)
            .FirstOrDefaultAsync(a => a.Id == req.AcquirerId, ct);

        if (acquirer == null)
        {
            await Send.ResponseAsync(new ReadAcquirerRequiredFieldsResponse
            {
                Error = new("Adquirente não encontrada.")
            }, 404, ct);
            return;
        }

        var config = AcquirerRequiredFieldsDefaults.GetDefaultConfig(acquirer.Type);

        await Send.OkAsync(new ReadAcquirerRequiredFieldsResponse
        {
            Data = config
        }, ct);
    }
}
