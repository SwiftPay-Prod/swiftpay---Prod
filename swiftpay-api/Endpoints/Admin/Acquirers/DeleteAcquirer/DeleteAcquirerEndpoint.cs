using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Admin.Acquirers.DeleteAcquirer;

public sealed class DeleteAcquirerEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<DeleteAcquirerRequest, DeleteAcquirerResponse>
{
    public override void Configure()
    {
        Delete("acquirers/{acquirerId:guid}");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(DeleteAcquirerRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new DeleteAcquirerResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var userRole = EndpointUtils.GetUserRole(User);
        if (userRole != "God")
        {
            await Send.ResponseAsync(new DeleteAcquirerResponse
            {
                Error = new("Apenas usuários com cargo God podem deletar adquirentes.")
            }, 403, ct);
            return;
        }

        var acquirer = await dbContext.Acquirers
            .OrderBy(a => a.Id)
            .FirstOrDefaultAsync(a => a.Id == req.AcquirerId, ct);

        if (acquirer == null)
        {
            await Send.ResponseAsync(new DeleteAcquirerResponse
            {
                Error = new("Adquirente não encontrada.")
            }, 404, ct);
            return;
        }

        var hasActiveMerchants = await dbContext.MerchantAcquirers
            .AnyAsync(ma => ma.AcquirerId == req.AcquirerId && ma.IsActive, ct);

        if (hasActiveMerchants)
        {
            await Send.ResponseAsync(new DeleteAcquirerResponse
            {
                Error = new("Não é possível deletar esta adquirente pois há merchants ativos vinculados a ela.")
            }, 409, ct);
            return;
        }

        dbContext.Acquirers.Remove(acquirer);
        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new DeleteAcquirerResponse
        {
            Message = $"Adquirente '{acquirer.DisplayName ?? acquirer.Name}' deletada com sucesso."
        }, ct);
    }
}
