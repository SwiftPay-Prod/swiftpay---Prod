using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Users.SelectEmblem;

public sealed class SelectEmblemEndpoint(PrimaryDbContext dbContext)
    : Endpoint<SelectEmblemRequest, SelectEmblemResponse>
{
    public override void Configure()
    {
        Patch("emblem");
        Group<UserGroup>();
    }

    public override async Task HandleAsync(SelectEmblemRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new SelectEmblemResponse { Error = new("Token inválido.") }, 401, ct);
            return;
        }

        if (req.AchievementId.HasValue)
        {
            var isEarned = await dbContext.UserAchievements
                .IgnoreQueryFilters()
                .AnyAsync(ua => ua.UserId == userId && ua.AchievementId == req.AchievementId.Value, ct);

            if (!isEarned)
            {
                await Send.ResponseAsync(new SelectEmblemResponse { Error = new("Conquista não desbloqueada.") }, 400, ct);
                return;
            }

            var existing = await dbContext.UserSelectedEmblems
                .OrderBy(use => use.Id)
                .FirstOrDefaultAsync(use => use.UserId == userId && use.AchievementId == req.AchievementId.Value, ct);

            if (existing != null)
            {
                dbContext.UserSelectedEmblems.Remove(existing);
                await dbContext.SaveChangesAsync(ct);
                await Send.OkAsync(new SelectEmblemResponse { Message = "Emblema removido." }, ct);
            }
            else
            {
                dbContext.UserSelectedEmblems.Add(new UserSelectedEmblem
                {
                    UserId = userId.Value,
                    AchievementId = req.AchievementId.Value
                });
                await dbContext.SaveChangesAsync(ct);
                await Send.OkAsync(new SelectEmblemResponse { Message = "Emblema selecionado com sucesso!" }, ct);
            }
        }
        else
        {
            var allEmblems = await dbContext.UserSelectedEmblems
                .Where(use => use.UserId == userId)
                .ToListAsync(ct);
            dbContext.UserSelectedEmblems.RemoveRange(allEmblems);
            await dbContext.SaveChangesAsync(ct);
            await Send.OkAsync(new SelectEmblemResponse { Message = "Emblemas removidos." }, ct);
        }
    }
}
