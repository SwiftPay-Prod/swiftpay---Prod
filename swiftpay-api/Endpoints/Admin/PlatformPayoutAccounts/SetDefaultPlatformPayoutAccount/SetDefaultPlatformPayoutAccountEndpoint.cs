using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Database;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Admin.PlatformPayoutAccounts.SetDefaultPlatformPayoutAccount;

public sealed class SetDefaultPlatformPayoutAccountEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<SetDefaultPlatformPayoutAccountRequest, SetDefaultPlatformPayoutAccountResponse>
{
    public override void Configure()
    {
        Patch("platform-payout-accounts/{id:guid}/set-default");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(SetDefaultPlatformPayoutAccountRequest req, CancellationToken ct)
    {
        var role = EndpointUtils.GetUserRole(User);
        if (role != "God")
        {
            await Send.ResponseAsync(new SetDefaultPlatformPayoutAccountResponse
            {
                Error = new("Apenas usuários God podem definir a conta padrão da plataforma.")
            }, 403, ct);
            return;
        }

        var account = await dbContext.PlatformPayoutAccounts
            .OrderBy(a => a.Id)
            .FirstOrDefaultAsync(a => a.Id == req.Id, ct);

        if (account == null)
        {
            await Send.ResponseAsync(new SetDefaultPlatformPayoutAccountResponse
            {
                Error = new("Conta de saque não encontrada.")
            }, 404, ct);
            return;
        }

        if (account.DeactivatedAt.HasValue)
        {
            await Send.ResponseAsync(new SetDefaultPlatformPayoutAccountResponse
            {
                Error = new("Contas desativadas não podem ser definidas como padrão.")
            }, 400, ct);
            return;
        }

        if (account.IsActive)
        {
            await Send.ResponseAsync(new SetDefaultPlatformPayoutAccountResponse
            {
                Error = new("Esta conta já é a padrão da plataforma.")
            }, 400, ct);
            return;
        }

        var currentActive = await dbContext.PlatformPayoutAccounts
            .Where(a => a.IsActive)
            .ToListAsync(ct);

        foreach (var activeAccount in currentActive)
        {
            activeAccount.IsActive = false;
        }

        account.IsActive = true;

        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new SetDefaultPlatformPayoutAccountResponse
        {
            Message = "Conta definida como padrão com sucesso!"
        }, ct);
    }
}
