using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Admin.Achievements.BackfillAchievements;

public sealed class BackfillAchievementsEndpoint(
    PrimaryDbContext dbContext,
    IAchievementService achievementService
) : EndpointWithoutRequest<BackfillAchievementsResponse>
{
    public override void Configure()
    {
        Post("achievements/backfill");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var role = EndpointUtils.GetUserRole(User);
        if (role != nameof(UserRole.God))
        {
            await Send.ForbiddenAsync(ct);
            return;
        }

        var userIds = await dbContext.Users
            .IgnoreQueryFilters()
            .Select(u => u.Id)
            .Distinct()
            .ToListAsync(ct);

        var environments = new[] { ApiEnvironment.Sandbox, ApiEnvironment.Production };

        var beforeCount = await dbContext.UserAchievements
            .IgnoreQueryFilters()
            .CountAsync(ct);

        foreach (var userId in userIds)
        {
            foreach (var environment in environments)
            {
                await achievementService.CheckAndAwardAsync(userId, environment, ct);
            }
        }

        var afterCount = await dbContext.UserAchievements
            .IgnoreQueryFilters()
            .CountAsync(ct);

        await Send.OkAsync(new BackfillAchievementsResponse
        {
            Data = new BackfillAchievementsData
            {
                MerchantsProcessed = userIds.Count,
                AchievementsAwarded = afterCount - beforeCount
            },
            Message = $"Backfill concluído. {afterCount - beforeCount} conquistas concedidas para {userIds.Count} usuários."
        }, ct);
    }
}
