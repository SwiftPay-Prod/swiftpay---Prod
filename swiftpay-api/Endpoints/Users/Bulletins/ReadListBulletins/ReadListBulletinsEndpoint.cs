using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.EndpointsGroups;
using safefy_api_core.Database;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Users.Bulletins.ReadListBulletins;

public sealed class ReadListBulletinsEndpoint(
    PrimaryDbContext dbContext
) : EndpointWithoutRequest<ReadListBulletinsResponse>
{
    public override void Configure()
    {
        Get("bulletins");
        Group<UserGroup>();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadListBulletinsResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var now = DateTime.UtcNow;

        var bulletinData = await dbContext.Bulletins
            .Where(b => b.ExpiresAt > now)
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new
            {
                b.Id,
                b.Title,
                b.CreatedAt,
                IsRead = dbContext.BulletinReads.Any(br => br.BulletinId == b.Id && br.UserId == userId.Value),
                Reactions = dbContext.BulletinReactions
                    .Where(r => r.BulletinId == b.Id)
                    .Select(r => new { r.UserId, r.Emoji })
                    .ToList()
            })
            .ToListAsync(ct);

        var bulletins = bulletinData.Select(b => new BulletinListItem
        {
            Id = b.Id,
            Title = b.Title,
            CreatedAt = b.CreatedAt,
            IsRead = b.IsRead,
            UserReactions = b.Reactions.Where(r => r.UserId == userId.Value).Select(r => r.Emoji).ToList(),
            ReactionCounts = b.Reactions.GroupBy(r => r.Emoji).ToDictionary(g => g.Key, g => g.Count())
        }).ToList();

        await Send.OkAsync(new ReadListBulletinsResponse
        {
            Data = bulletins
        }, ct);
    }
}
