using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.EndpointsGroups;
using safefy_api_core.Database;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Users.Bulletins.ReadBulletinContent;

public sealed class ReadBulletinContentEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadBulletinContentRequest, ReadBulletinContentResponse>
{
    public override void Configure()
    {
        Get("bulletins/{bulletinId:guid}");
        Group<UserGroup>();
    }

    public override async Task HandleAsync(ReadBulletinContentRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadBulletinContentResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var now = DateTime.UtcNow;

        var bulletin = await dbContext.Bulletins
            .Where(b => b.Id == req.BulletinId && b.ExpiresAt > now)
            .Select(b => new
            {
                b.Id,
                b.Title,
                b.Content,
                b.CreatedAt,
                IsRead = dbContext.BulletinReads.Any(br => br.BulletinId == b.Id && br.UserId == userId.Value)
            })
            .OrderBy(x => x.Id)
            .FirstOrDefaultAsync(ct);

        if (bulletin == null)
        {
            await Send.ResponseAsync(new ReadBulletinContentResponse
            {
                Error = new("Informativo não encontrado ou expirado.")
            }, 404, ct);
            return;
        }

        var userReactions = await dbContext.BulletinReactions
            .Where(br => br.BulletinId == req.BulletinId && br.UserId == userId.Value)
            .Select(br => br.Emoji)
            .ToListAsync(ct);

        var reactionCounts = await dbContext.BulletinReactions
            .Where(br => br.BulletinId == req.BulletinId)
            .GroupBy(br => br.Emoji)
            .Select(g => new { Emoji = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Emoji, x => x.Count, ct);

        await Send.OkAsync(new ReadBulletinContentResponse
        {
            Data = new BulletinContentData
            {
                Id = bulletin.Id,
                Title = bulletin.Title,
                Content = bulletin.Content,
                CreatedAt = bulletin.CreatedAt,
                IsRead = bulletin.IsRead,
                UserReactions = userReactions,
                ReactionCounts = reactionCounts
            }
        }, ct);
    }
}
