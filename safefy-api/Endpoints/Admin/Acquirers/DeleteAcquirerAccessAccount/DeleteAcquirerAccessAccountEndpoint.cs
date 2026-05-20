using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Admin.Acquirers.DeleteAcquirerAccessAccount;

public sealed class DeleteAcquirerAccessAccountEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<DeleteAcquirerAccessAccountRequest, DeleteAcquirerAccessAccountResponse>
{
    public override void Configure()
    {
        Delete("acquirers/{acquirerId:guid}/access-accounts/{accountIndex:int}");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(DeleteAcquirerAccessAccountRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new DeleteAcquirerAccessAccountResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var acquirer = await dbContext.Acquirers
            .FirstOrDefaultAsync(a => a.Id == req.AcquirerId, ct);

        if (acquirer == null)
        {
            await Send.ResponseAsync(new DeleteAcquirerAccessAccountResponse
            {
                Error = new("Adquirente não encontrada.")
            }, 404, ct);
            return;
        }

        var accessAccounts = acquirer.AccessAccounts?.ToList() ?? [];
        if (req.AccountIndex >= accessAccounts.Count)
        {
            await Send.ResponseAsync(new DeleteAcquirerAccessAccountResponse
            {
                Error = new("Conta de acesso não encontrada para remoção.")
            }, 404, ct);
            return;
        }

        accessAccounts.RemoveAt(req.AccountIndex);

        acquirer.AccessAccounts = accessAccounts;
        acquirer.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new DeleteAcquirerAccessAccountResponse
        {
            Data = new DeleteAcquirerAccessAccountData
            {
                AcquirerId = acquirer.Id,
                AccessAccounts = acquirer.AccessAccounts
            },
            Message = "Conta de acesso removida com sucesso."
        }, ct);
    }
}
