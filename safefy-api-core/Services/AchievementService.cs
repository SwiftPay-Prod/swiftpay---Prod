using Microsoft.EntityFrameworkCore;
using safefy_api_core.Constants;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api_core.Services;

public class AchievementService(PrimaryDbContext dbContext) : IAchievementService
{
    public MerchantLevel ComputeLevel(long totalVolume)
    {
        for (var i = UserProgressionConstants.LevelThresholds.Length - 1; i >= 0; i--)
        {
            if (totalVolume >= UserProgressionConstants.LevelThresholds[i].Min)
                return UserProgressionConstants.LevelThresholds[i].Level;
        }
        return MerchantLevel.Iron;
    }

    public long? VolumeTillNextLevel(long totalVolume)
    {
        var level = ComputeLevel(totalVolume);
        var idx = (int)level;
        if (idx >= UserProgressionConstants.LevelThresholds.Length - 1) return null;
        return UserProgressionConstants.LevelThresholds[idx + 1].Min - totalVolume;
    }

    public int LevelProgress(long totalVolume)
    {
        var level = ComputeLevel(totalVolume);
        var idx = (int)level;
        var entry = UserProgressionConstants.LevelThresholds[idx];
        var range = entry.Max - entry.Min;
        if (range <= 0) return 100;
        var progress = (double)(totalVolume - entry.Min) / range * 100.0;
        return (int)Math.Clamp(progress, 0, 100);
    }

    public async Task CheckAndAwardAsync(Guid userId, ApiEnvironment environment, CancellationToken ct = default)
    {
        if (environment != ApiEnvironment.Production)
            return;

        var merchantIds = await dbContext.Merchants
            .IgnoreQueryFilters()
            .Where(m => m.UserId == userId)
            .Select(m => m.Id)
            .ToListAsync(ct);

        if (merchantIds.Count == 0) return;

        var now = DateTime.UtcNow;
        var totalVolume = await GetTotalVolumeForUserAsync(userId, merchantIds, environment, ct);

        var firstSellDate = await dbContext.Payments
            .IgnoreQueryFilters()
            .Where(p => merchantIds.Contains(p.MerchantId)
                     && p.Environment == environment
                     && p.Status == PaymentStatus.Completed)
            .OrderBy(p => p.CompletedAt)
            .Select(p => (DateTime?)p.CompletedAt)
            .FirstOrDefaultAsync(ct);

        var firstCheckoutDate = await dbContext.Payments
            .IgnoreQueryFilters()
            .Where(p => merchantIds.Contains(p.MerchantId)
                     && p.Environment == environment
                     && p.Status == PaymentStatus.Completed
                     && p.OrderId != null)
            .OrderBy(p => p.CompletedAt)
            .Select(p => (DateTime?)p.CompletedAt)
            .FirstOrDefaultAsync(ct);

        var allAchievements = await dbContext.Achievements
            .Where(a => a.IsActive)
            .ToListAsync(ct);

        var earnedIds = await dbContext.UserAchievements
            .IgnoreQueryFilters()
            .Where(ua => ua.UserId == userId && ua.Environment == environment)
            .Select(ua => ua.AchievementId)
            .ToHashSetAsync(ct);

        var toAward = new List<UserAchievement>();

        foreach (var achievement in allAchievements)
        {
            if (earnedIds.Contains(achievement.Id)) continue;

            var (earned, earnedAt) = achievement.Type switch
            {
                AchievementType.VolumeThreshold =>
                    (achievement.ThresholdAmount.HasValue && totalVolume >= achievement.ThresholdAmount.Value, now),
                AchievementType.FirstSell =>
                    (firstSellDate.HasValue, firstSellDate ?? now),
                AchievementType.FirstCheckout =>
                    (firstCheckoutDate.HasValue, firstCheckoutDate ?? now),
                _ => (false, now)
            };

            if (earned)
            {
                toAward.Add(new UserAchievement
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    AchievementId = achievement.Id,
                    Environment = environment,
                    EarnedAt = earnedAt,
                    CreatedAt = now,
                    UpdatedAt = now
                });
            }
        }

        if (toAward.Count > 0)
        {
            dbContext.UserAchievements.AddRange(toAward);
            await dbContext.SaveChangesAsync(ct);
        }
    }

    private async Task<long> GetTotalVolumeForUserAsync(Guid userId, List<Guid> merchantIds, ApiEnvironment environment, CancellationToken ct)
    {
        return await dbContext.Payments
            .IgnoreQueryFilters()
            .Where(p => merchantIds.Contains(p.MerchantId)
                     && p.Environment == environment
                     && p.Status == PaymentStatus.Completed)
            .SumAsync(p => (long?)p.Amount, ct) ?? 0L;
    }
}
