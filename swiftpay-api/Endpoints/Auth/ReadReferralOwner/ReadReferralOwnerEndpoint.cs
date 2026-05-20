using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Auth.ReadReferralOwner;

public sealed class ReadReferralOwnerEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadReferralOwnerRequest, ReadReferralOwnerResponse>
{
    public override void Configure()
    {
        Get("referrals/{refCode}");
        Group<AuthGroup>();
        AllowAnonymous();
    }

    public override async Task HandleAsync(ReadReferralOwnerRequest req, CancellationToken ct)
    {
        var refCode = req.RefCode.Trim().ToUpperInvariant();

        var owner = await dbContext.Users
            .AsNoTracking()
            .Where(u => u.ReferralCode == refCode && u.Status == UserStatus.Active)
            .OrderBy(u => u.Id)
            .Select(u => new ReadReferralOwnerData
            {
                RefCode = u.ReferralCode!,
                OwnerName = u.Name
            })
            .FirstOrDefaultAsync(ct);

        if (owner == null)
        {
            await Send.ResponseAsync(new ReadReferralOwnerResponse
            {
                Error = new("Código de indicação inválido.")
            }, 404, ct);
            return;
        }

        await Send.OkAsync(new ReadReferralOwnerResponse
        {
            Data = owner
        }, ct);
    }
}
