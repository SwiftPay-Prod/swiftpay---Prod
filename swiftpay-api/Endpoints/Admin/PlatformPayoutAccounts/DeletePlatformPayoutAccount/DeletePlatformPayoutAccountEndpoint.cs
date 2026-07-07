using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Database;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Admin.PlatformPayoutAccounts.DeletePlatformPayoutAccount;

public sealed class DeletePlatformPayoutAccountEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<DeletePlatformPayoutAccountRequest, DeletePlatformPayoutAccountResponse>
{
    public override void Configure()
    {
        Delete("platform-payout-accounts/{id:guid}");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(DeletePlatformPayoutAccountRequest req, CancellationToken ct)
    {
        var role = EndpointUtils.GetUserRole(User);
        if (role != "God")
        {
            await Send.ResponseAsync(new DeletePlatformPayoutAccountResponse
            {
                Error = new("Apenas usuários God podem desativar contas de saque da plataforma.")
            }, 403, ct);
            return;
        }

        var account = await dbContext.PlatformPayoutAccounts
            .OrderBy(a => a.Id)
            .FirstOrDefaultAsync(a => a.Id == req.Id, ct);

        if (account == null)
        {
            await Send.ResponseAsync(new DeletePlatformPayoutAccountResponse
            {
                Error = new("Conta de saque não encontrada.")
            }, 404, ct);
            return;
        }

        if (account.IsActive)
        {
            await Send.ResponseAsync(new DeletePlatformPayoutAccountResponse
            {
                Error = new("A conta padrão não pode ser removida. Defina outra conta como padrão antes de excluir.")
            }, 400, ct);
            return;
        }

        if (!account.IsActive)
        {
            await Send.ResponseAsync(new DeletePlatformPayoutAccountResponse
            {
                Error = new("Esta conta já está desativada.")
            }, 400, ct);
            return;
        }

        account.IsActive = false;
        account.DeactivatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new DeletePlatformPayoutAccountResponse
        {
            Message = "Conta de saque desativada com sucesso!"
        }, ct);
    }
}
