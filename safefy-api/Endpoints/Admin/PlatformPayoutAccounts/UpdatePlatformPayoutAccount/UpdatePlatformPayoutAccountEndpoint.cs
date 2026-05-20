using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.EndpointsGroups;
using safefy_api.Mappers;
using safefy_api_core.Database;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Admin.PlatformPayoutAccounts.UpdatePlatformPayoutAccount;

public sealed class UpdatePlatformPayoutAccountEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<UpdatePlatformPayoutAccountRequest, UpdatePlatformPayoutAccountResponse>
{
    public override void Configure()
    {
        Patch("platform-payout-accounts/{id:guid}");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(UpdatePlatformPayoutAccountRequest req, CancellationToken ct)
    {
        var role = EndpointUtils.GetUserRole(User);
        if (role != "God")
        {
            await Send.ResponseAsync(new UpdatePlatformPayoutAccountResponse
            {
                Error = new("Apenas usuários God podem atualizar contas de saque da plataforma.")
            }, 403, ct);
            return;
        }

        var account = await dbContext.PlatformPayoutAccounts
            .Include(a => a.CreatedByUser)
            .OrderBy(a => a.Id)
            .FirstOrDefaultAsync(a => a.Id == req.Id, ct);

        if (account == null)
        {
            await Send.ResponseAsync(new UpdatePlatformPayoutAccountResponse
            {
                Error = new("Conta de saque não encontrada.")
            }, 404, ct);
            return;
        }

        if (req.PixKeyType.HasValue) account.PixKeyType = req.PixKeyType.Value;
        if (req.PixKey != null) account.PixKey = req.PixKey;
        if (req.HolderName != null) account.HolderName = req.HolderName;
        if (req.HolderDocument != null) account.HolderDocument = req.HolderDocument;
        if (req.BankName != null) account.BankName = req.BankName;
        if (req.BankIspb != null) account.BankIspb = req.BankIspb;

        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new UpdatePlatformPayoutAccountResponse
        {
            Data = PlatformPayoutAccountMapper.ToData(account),
            Message = "Conta de saque atualizada com sucesso!"
        }, ct);
    }
}
