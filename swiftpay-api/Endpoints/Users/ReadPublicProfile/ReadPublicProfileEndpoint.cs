using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Constants;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api.Endpoints.Users.ReadPublicProfile;

public sealed class ReadPublicProfileEndpoint(
    PrimaryDbContext dbContext,
    IAchievementService achievementService
)
    : Endpoint<ReadPublicProfileRequest, ReadPublicProfileResponse>
{
    public override void Configure()
    {
        Get("{userId:guid}/public-profile");
        Group<UserGroup>();
        AllowAnonymous();
    }

    public override async Task HandleAsync(ReadPublicProfileRequest req, CancellationToken ct)
    {
        var user = await dbContext.Users
            .AsNoTracking()
            .Select(u => new
            {
                u.Id,
                u.Name,
                u.Bio,
                u.SocialLinks,
                u.ProfileImageUrl,
                u.SelectedBorderLevel
            })
            .OrderBy(u => u.Id)
            .FirstOrDefaultAsync(u => u.Id == req.UserId, ct);

        if (user == null)
        {
            await Send.ResponseAsync(new ReadPublicProfileResponse { Error = new("Usuário não encontrado.") }, 404, ct);
            return;
        }

        string? borderImageUrl = null;
        if (user.SelectedBorderLevel.HasValue)
        {
            borderImageUrl = await dbContext.LevelConfigs
                .AsNoTracking()
                .Where(lc => lc.Level == user.SelectedBorderLevel.Value)
                .OrderBy(lc => lc.Id)
                .Select(lc => lc.BorderImageUrl)
                .FirstOrDefaultAsync(ct);
        }

        var selectedEmblems = await dbContext.UserSelectedEmblems
            .AsNoTracking()
            .Where(use => use.UserId == user.Id)
            .Select(use => new
            {
                use.AchievementId,
                use.Achievement.ImageUrl,
                use.Achievement.Title,
                use.Achievement.Description
            })
            .ToListAsync(ct);

        var achievementIds = selectedEmblems.Select(se => se.AchievementId).ToList();
        var earnedAtMap = achievementIds.Count > 0
            ? await dbContext.UserAchievements
                .AsNoTracking()
                .IgnoreQueryFilters()
                .Where(ua => ua.UserId == user.Id
                    && achievementIds.Contains(ua.AchievementId)
                    && ua.Environment == ApiEnvironment.Production)
                .ToDictionaryAsync(ua => ua.AchievementId, ua => (DateTime?)ua.EarnedAt, ct)
            : new Dictionary<Guid, DateTime?>();

        var emblems = selectedEmblems.Select(se => new PublicProfileEmblemData
        {
            Id = se.AchievementId,
            ImageUrl = se.ImageUrl,
            Title = se.Title,
            Description = se.Description,
            EarnedAt = earnedAtMap.GetValueOrDefault(se.AchievementId)
        }).ToList();

        var merchantIds = await dbContext.Merchants
            .AsNoTracking()
            .Where(m => m.UserId == user.Id)
            .Select(m => m.Id)
            .ToListAsync(ct);

        var totalVolume = merchantIds.Count > 0
            ? await dbContext.Payments
                .AsNoTracking()
                .IgnoreQueryFilters()
                .Where(p => merchantIds.Contains(p.MerchantId)
                    && p.Status == PaymentStatus.Completed
                    && p.Environment == ApiEnvironment.Production)
                .SumAsync(p => (long?)p.Amount, ct) ?? 0L
            : 0L;

        var currentLevel = achievementService.ComputeLevel(totalVolume);
        var progress = achievementService.LevelProgress(totalVolume);
        var currentLevelIndex = (int)currentLevel;
        var (_, minThreshold, maxThreshold) = UserProgressionConstants.LevelThresholds[currentLevelIndex];

        string? nextLevelKey = null;
        if (currentLevelIndex < UserProgressionConstants.LevelThresholds.Length - 1)
        {
            nextLevelKey = UserProgressionConstants.LevelThresholds[currentLevelIndex + 1].Level.ToString();
        }

        var allLevelConfigs = await dbContext.LevelConfigs
            .AsNoTracking()
            .ToListAsync(ct);

        var currentLevelConfig = allLevelConfigs.FirstOrDefault(lc => lc.Level == currentLevel);
        var currentLevelName = currentLevelConfig?.DisplayName ?? currentLevel.ToString();
        string? nextLevelName = nextLevelKey != null
            ? allLevelConfigs.FirstOrDefault(lc => lc.Level == UserProgressionConstants.LevelThresholds[currentLevelIndex + 1].Level)?.DisplayName
            : null;

        var earnedCount = await dbContext.UserAchievements
            .AsNoTracking()
            .IgnoreQueryFilters()
            .CountAsync(ua => ua.UserId == user.Id && ua.Environment == ApiEnvironment.Production, ct);

        var totalAchievements = await dbContext.Achievements
            .AsNoTracking()
            .CountAsync(a => a.IsActive, ct);

        await Send.OkAsync(new ReadPublicProfileResponse
        {
            Data = new PublicProfileData
            {
                Id = user.Id,
                Name = user.Name,
                Bio = user.Bio,
                SocialLinks = user.SocialLinks,
                ProfileImageUrl = user.ProfileImageUrl,
                BannerImageUrl = null,
                SelectedBorderImageUrl = borderImageUrl,
                SelectedBorderLevel = user.SelectedBorderLevel?.ToString(),
                LevelInfo = new PublicProfileLevelInfoData
                {
                    Current = currentLevel.ToString(),
                    CurrentDisplayName = currentLevelName,
                    NextLevel = nextLevelKey,
                    NextLevelDisplayName = nextLevelName,
                    TotalVolume = totalVolume,
                    MinThreshold = minThreshold,
                    MaxThreshold = maxThreshold,
                    Progress = progress,
                    BorderImageUrl = currentLevelConfig?.BorderImageUrl,
                },
                EarnedCount = earnedCount,
                TotalAchievements = totalAchievements,
                SelectedEmblems = emblems
            }
        }, ct);
    }
}
