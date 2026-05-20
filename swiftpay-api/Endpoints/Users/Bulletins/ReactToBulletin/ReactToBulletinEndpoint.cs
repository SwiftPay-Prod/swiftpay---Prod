using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.EndpointsGroups;
using safefy_api_core.Database;
using safefy_api_core.Models.Database;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Users.Bulletins.ReactToBulletin;

public sealed class ReactToBulletinEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReactToBulletinRequest, ReactToBulletinResponse>
{
    public override void Configure()
    {
        Post("bulletins/{bulletinId:guid}/react");
        Group<UserGroup>();
    }

    public override async Task HandleAsync(ReactToBulletinRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReactToBulletinResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var now = DateTime.UtcNow;

        var bulletin = await dbContext.Bulletins
            .Where(b => b.Id == req.BulletinId && b.ExpiresAt > now)
            .OrderBy(x => x.Id)
            .FirstOrDefaultAsync(ct);

        if (bulletin == null)
        {
            await Send.ResponseAsync(new ReactToBulletinResponse
            {
                Error = new("Informativo não encontrado ou expirado.")
            }, 404, ct);
            return;
        }

        if (string.IsNullOrWhiteSpace(req.Emoji))
        {
            await Send.ResponseAsync(new ReactToBulletinResponse
            {
                Error = new("O emoji é obrigatório.")
            }, 400, ct);
            return;
        }

        var existingReaction = await dbContext.BulletinReactions
            .Where(br => br.BulletinId == req.BulletinId && br.UserId == userId.Value && br.Emoji == req.Emoji)
            .OrderBy(x => x.Id)
            .FirstOrDefaultAsync(ct);

        if (existingReaction != null)
        {
            dbContext.BulletinReactions.Remove(existingReaction);
        }
        else
        {
            var reaction = new BulletinReaction
            {
                BulletinId = req.BulletinId,
                UserId = userId.Value,
                Emoji = req.Emoji
            };
            dbContext.BulletinReactions.Add(reaction);
        }

        await dbContext.SaveChangesAsync(ct);

        var userReactions = await dbContext.BulletinReactions
            .Where(br => br.BulletinId == req.BulletinId && br.UserId == userId.Value)
            .Select(br => br.Emoji)
            .ToListAsync(ct);

        var reactionCounts = await dbContext.BulletinReactions
            .Where(br => br.BulletinId == req.BulletinId)
            .GroupBy(br => br.Emoji)
            .Select(g => new { Emoji = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Emoji, x => x.Count, ct);

        await Send.OkAsync(new ReactToBulletinResponse
        {
            Data = new ReactToBulletinData
            {
                UserReactions = userReactions,
                ReactionCounts = reactionCounts
            }
        }, ct);
    }
}
