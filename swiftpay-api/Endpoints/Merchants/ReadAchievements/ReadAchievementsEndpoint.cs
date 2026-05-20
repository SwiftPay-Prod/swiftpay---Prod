using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Constants;
using safefy_api_core.Utils;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api.Endpoints.Merchants.ReadAchievements;

public sealed class ReadAchievementsEndpoint(
    PrimaryDbContext dbContext,
    IAchievementService achievementService
) : Endpoint<ReadAchievementsRequest, ReadAchievementsResponse>
{
    public override void Configure()
    {
        Get("{merchantId:guid}/achievements");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadAchievementsRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadAchievementsResponse { Error = new("Token inválido.") }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new ReadAchievementsResponse { Error = new("Organização não encontrada.") }, 404, ct);
            return;
        }

        var user = await dbContext.Users
            .OrderBy(u => u.Id)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);

        if (user == null)
        {
            await Send.ResponseAsync(new ReadAchievementsResponse { Error = new("Usuário não encontrado.") }, 404, ct);
            return;
        }

        var totalVolume = await dbContext.Payments
            .IgnoreQueryFilters()
            .Where(p => p.MerchantId == req.MerchantId
                && p.Status == PaymentStatus.Completed
                && p.Environment == ApiEnvironment.Production)
            .SumAsync(p => (long?)p.Amount, ct) ?? 0L;

        var currentLevel = achievementService.ComputeLevel(totalVolume);
        var progress = achievementService.LevelProgress(totalVolume);
        var currentIdx = (int)currentLevel;

        var (_, currentMin, currentMax) = UserProgressionConstants.LevelThresholds[currentIdx];

        string? nextLevelKey = null;
        if (currentIdx < UserProgressionConstants.LevelThresholds.Length - 1)
        {
            nextLevelKey = UserProgressionConstants.LevelThresholds[currentIdx + 1].Level.ToString();
        }

        var levelConfig = await dbContext.LevelConfigs
            .IgnoreQueryFilters()
            .OrderBy(lc => lc.Id)
            .FirstOrDefaultAsync(lc => lc.Level == currentLevel, ct);

        var allAchievements = await dbContext.Achievements
            .Where(a => a.IsActive)
            .OrderBy(a => a.SortOrder)
            .ToListAsync(ct);

        var earnedMap = await dbContext.UserAchievements
            .IgnoreQueryFilters()
            .Where(ua => ua.UserId == userId.Value && ua.Environment == ApiEnvironment.Production)
            .ToDictionaryAsync(ua => ua.AchievementId, ua => ua.EarnedAt, ct);

        var selectedEmblemIds = await dbContext.UserSelectedEmblems
            .Where(use => use.UserId == userId)
            .Select(use => use.AchievementId)
            .ToListAsync(ct);

        string? selectedBorderImageUrl = null;
        if (user.SelectedBorderLevel.HasValue)
        {
            var borderConfig = await dbContext.LevelConfigs
                .IgnoreQueryFilters()
                .OrderBy(lc => lc.Id)
                .FirstOrDefaultAsync(lc => lc.Level == user.SelectedBorderLevel.Value, ct);
            selectedBorderImageUrl = borderConfig?.BorderImageUrl;
        }

        var achievementItems = allAchievements.Select(a => new MerchantAchievementItemData
        {
            Id = a.Id,
            Key = a.Key,
            Title = a.Title,
            Subtitle = a.Subtitle,
            Description = a.Description,
            ImageUrl = a.ImageUrl,
            Type = a.Type.ToString(),
            ThresholdAmount = a.ThresholdAmount,
            SortOrder = a.SortOrder,
            IsEarned = earnedMap.ContainsKey(a.Id),
            EarnedAt = earnedMap.TryGetValue(a.Id, out var earnedAt) ? earnedAt : null
        }).ToList();

        var allLevelConfigs = await dbContext.LevelConfigs
            .IgnoreQueryFilters()
            .ToListAsync(ct);

        var currentName = allLevelConfigs.FirstOrDefault(lc => lc.Level == currentLevel)?.DisplayName ?? currentLevel.ToString();
        string? nextLevelName = nextLevelKey != null
            ? allLevelConfigs.FirstOrDefault(lc => lc.Level == UserProgressionConstants.LevelThresholds[currentIdx + 1].Level)?.DisplayName
            : null;

        var levelBorders = UserProgressionConstants.LevelThresholds.Select(lt =>
        {
            var config = allLevelConfigs.FirstOrDefault(lc => lc.Level == lt.Level);
            return new LevelBorderData
            {
                Level = lt.Level.ToString(),
                DisplayName = config?.DisplayName ?? lt.Level.ToString(),
                BorderImageUrl = config?.BorderImageUrl
            };
        }).ToList();

        await Send.OkAsync(new ReadAchievementsResponse
        {
            Data = new ReadAchievementsData
            {
                LevelInfo = new MerchantLevelData
                {
                    Current = currentLevel.ToString(),
                    CurrentDisplayName = currentName,
                    NextLevel = nextLevelKey,
                    NextLevelDisplayName = nextLevelName,
                    TotalVolume = totalVolume,
                    MinThreshold = currentMin,
                    MaxThreshold = currentMax,
                    Progress = progress,
                    BorderImageUrl = levelConfig?.BorderImageUrl
                },
                Achievements = achievementItems,
                LevelBorders = levelBorders,
                SelectedEmblemIds = selectedEmblemIds,
                SelectedBorderLevel = user.SelectedBorderLevel?.ToString(),
                SelectedBorderImageUrl = selectedBorderImageUrl
            }
        }, ct);
    }
}
