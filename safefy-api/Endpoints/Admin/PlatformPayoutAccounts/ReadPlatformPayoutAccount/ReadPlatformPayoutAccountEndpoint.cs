using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.Endpoints.Admin.PlatformPayoutAccounts.CreatePlatformPayoutAccount;
using safefy_api.EndpointsGroups;
using safefy_api.Mappers;
using safefy_api_core.Database;

namespace safefy_api.Endpoints.Admin.PlatformPayoutAccounts.ReadPlatformPayoutAccount;

public sealed class ReadPlatformPayoutAccountEndpoint(
    PrimaryDbContext dbContext
) : EndpointWithoutRequest<ReadPlatformPayoutAccountResponse>
{
    public override void Configure()
    {
        Get("platform-payout-accounts/active");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var account = await dbContext.PlatformPayoutAccounts
            .Include(a => a.CreatedByUser)
            .OrderBy(a => a.Id)
            .FirstOrDefaultAsync(a => a.IsActive, ct);

        if (account == null)
        {
            await Send.ResponseAsync(new ReadPlatformPayoutAccountResponse
            {
                Error = new("Nenhuma conta de saque ativa encontrada.")
            }, 404, ct);
            return;
        }

        await Send.OkAsync(new ReadPlatformPayoutAccountResponse
        {
            Data = PlatformPayoutAccountMapper.ToData(account)
        }, ct);
    }
}
