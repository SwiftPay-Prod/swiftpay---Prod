using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.EndpointsGroups;
using safefy_api.Mappers;
using safefy_api_core.Database;
using safefy_api_core.Models.Database;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Admin.PlatformPayoutAccounts.CreatePlatformPayoutAccount;

public sealed class CreatePlatformPayoutAccountEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<CreatePlatformPayoutAccountRequest, CreatePlatformPayoutAccountResponse>
{
    public override void Configure()
    {
        Post("platform-payout-accounts");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(CreatePlatformPayoutAccountRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        var role = EndpointUtils.GetUserRole(User);

        if (userId == null)
        {
            await Send.ResponseAsync(new CreatePlatformPayoutAccountResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        if (role != nameof(UserRole.God))
        {
            await Send.ResponseAsync(new CreatePlatformPayoutAccountResponse
            {
                Error = new("Apenas o cargo God pode cadastrar contas de saque da plataforma.")
            }, 403, ct);
            return;
        }

        var currentActive = await dbContext.PlatformPayoutAccounts
            .Where(a => a.IsActive)
            .ToListAsync(ct);

        foreach (var account in currentActive)
        {
            account.IsActive = false;
        }

        var newAccount = new PlatformPayoutAccount
        {
            PixKeyType = req.PixKeyType,
            PixKey = req.PixKey,
            HolderName = req.HolderName,
            HolderDocument = req.HolderDocument,
            BankName = req.BankName,
            BankIspb = req.BankIspb,
            IsActive = true,
            CreatedByUserId = userId.Value
        };

        dbContext.PlatformPayoutAccounts.Add(newAccount);
        await dbContext.SaveChangesAsync(ct);

        var user = await dbContext.Users.FindAsync([userId.Value], ct);

        await Send.ResponseAsync(new CreatePlatformPayoutAccountResponse
        {
            Data = PlatformPayoutAccountMapper.ToData(newAccount, user?.Name),
            Message = "Conta de saque da plataforma cadastrada com sucesso!"
        }, 201, ct);
    }
}
