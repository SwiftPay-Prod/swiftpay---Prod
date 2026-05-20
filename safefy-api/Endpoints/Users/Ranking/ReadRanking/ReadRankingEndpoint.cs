using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api.Endpoints.Users.ReadPublicProfile;
using safefy_api_core.Constants;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Users.Ranking.ReadRanking;

public sealed class ReadRankingEndpoint(
    PrimaryDbContext dbContext,
    IAchievementService achievementService,
    IRankingProcessingStatusService rankingProcessingStatusService
) : Endpoint<ReadRankingRequest, ReadRankingResponse>
{
    public override void Configure()
    {
        Get("ranking");
        Group<UserGroup>();
    }

    public override async Task HandleAsync(ReadRankingRequest req, CancellationToken ct)
    {
        var page = req.Page < 1 ? 1 : req.Page;
        var pageSize = req.PageSize < 1 ? 20 : req.PageSize > 100 ? 100 : req.PageSize;
        var type = req.Type;
        var period = type == RankingType.Referral ? RankingPeriod.Annual : req.Period;

        var rankingItems = type == RankingType.Referral
            ? await LoadReferralRankingItemsAsync(page, pageSize, ct)
            : await LoadVolumeRankingItemsAsync(period, page, pageSize, ct);

        var userIds = rankingItems.Items.Select(r => r.UserId).ToList();

        var borderLevels = rankingItems.Items
            .Where(r => r.User?.SelectedBorderLevel != null)
            .Select(r => r.User!.SelectedBorderLevel!.Value)
            .Distinct()
            .ToList();

        var borderUrlByLevel = borderLevels.Count > 0
            ? await dbContext.LevelConfigs
                .AsNoTracking()
                .Where(lc => borderLevels.Contains(lc.Level))
                .ToDictionaryAsync(lc => lc.Level, lc => (string?)lc.BorderImageUrl, ct)
            : new Dictionary<MerchantLevel, string?>();

        var selectedEmblemData = await dbContext.UserSelectedEmblems
            .AsNoTracking()
            .Where(use => userIds.Contains(use.UserId))
            .Select(use => new
            {
                use.UserId,
                use.AchievementId,
                use.Achievement.ImageUrl,
                use.Achievement.Title,
                use.Achievement.Description
            })
            .ToListAsync(ct);

        var selectedAchievementIds = selectedEmblemData
            .Select(x => x.AchievementId)
            .Distinct()
            .ToList();

        var earnedAtByUserAchievement = selectedAchievementIds.Count > 0
            ? await dbContext.UserAchievements
                .AsNoTracking()
                .IgnoreQueryFilters()
                .Where(ua => userIds.Contains(ua.UserId)
                    && selectedAchievementIds.Contains(ua.AchievementId)
                    && ua.Environment == ApiEnvironment.Production)
                .ToDictionaryAsync(ua => $"{ua.UserId}:{ua.AchievementId}", ua => (DateTime?)ua.EarnedAt, ct)
            : new Dictionary<string, DateTime?>();

        var selectedEmblemsByUserId = selectedEmblemData
            .GroupBy(x => x.UserId)
            .ToDictionary(
                g => g.Key,
                g => g.Select(x => new PublicProfileEmblemData
                {
                    Id = x.AchievementId,
                    ImageUrl = x.ImageUrl,
                    Title = x.Title,
                    Description = x.Description,
                    EarnedAt = earnedAtByUserAchievement.GetValueOrDefault($"{x.UserId}:{x.AchievementId}")
                }).ToList());

        var merchantData = await dbContext.Merchants
            .AsNoTracking()
            .Where(m => userIds.Contains(m.UserId))
            .Select(m => new { m.Id, m.UserId })
            .ToListAsync(ct);

        var merchantToUserId = merchantData.ToDictionary(m => m.Id, m => m.UserId);
        var merchantIds = merchantData.Select(m => m.Id).ToList();

        var volumeByMerchant = merchantIds.Count > 0
            ? await dbContext.Payments
                .AsNoTracking()
                .IgnoreQueryFilters()
                .Where(p => merchantIds.Contains(p.MerchantId)
                    && p.Status == PaymentStatus.Completed
                    && p.Environment == ApiEnvironment.Production)
                .GroupBy(p => p.MerchantId)
                .Select(g => new { MerchantId = g.Key, Volume = g.Sum(p => p.Amount) })
                .ToListAsync(ct)
            : [];

        var totalVolumeByUser = volumeByMerchant
            .Where(v => merchantToUserId.ContainsKey(v.MerchantId))
            .GroupBy(v => merchantToUserId[v.MerchantId])
            .ToDictionary(g => g.Key, g => g.Sum(v => v.Volume));

        var earnedCountByUser = await dbContext.UserAchievements
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Where(ua => userIds.Contains(ua.UserId) && ua.Environment == ApiEnvironment.Production)
            .GroupBy(ua => ua.UserId)
            .Select(g => new { UserId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.UserId, x => x.Count, ct);

        var totalAchievements = await dbContext.Achievements
            .AsNoTracking()
            .CountAsync(a => a.IsActive, ct);

        var allLevelConfigs = await dbContext.LevelConfigs
            .AsNoTracking()
            .ToListAsync(ct);

        var levelBorderUrlByLevel = allLevelConfigs
            .GroupBy(lc => lc.Level)
            .ToDictionary(g => g.Key, g => (string?)g.First().BorderImageUrl);

        var levelDisplayNameByLevel = allLevelConfigs
            .GroupBy(lc => lc.Level)
            .ToDictionary(g => g.Key, g => (string?)g.First().DisplayName);

        await Send.OkAsync(new ReadRankingResponse
        {
            Data = new ReadRankingData
            {
                Items = rankingItems.Items.Select(r => new RankingEntryData
                {
                    UserId = r.UserId,
                    UserName = r.User?.Name,
                    ProfileImageUrl = r.User?.ProfileImageUrl,
                    UserPublicProfile = r.User == null
                        ? null
                        : new PublicProfileData
                        {
                            Id = r.User.Id,
                            Name = r.User.Name,
                            Bio = r.User.Bio,
                            SocialLinks = r.User.SocialLinks,
                            ProfileImageUrl = r.User.ProfileImageUrl,
                            BannerImageUrl = null,
                            SelectedBorderImageUrl = r.User.SelectedBorderLevel is MerchantLevel borderLevel
                                ? borderUrlByLevel.GetValueOrDefault(borderLevel)
                                : null,
                            SelectedBorderLevel = r.User.SelectedBorderLevel?.ToString(),
                            LevelInfo = BuildLevelInfoData(
                                totalVolumeByUser.GetValueOrDefault(r.UserId),
                                achievementService,
                                levelBorderUrlByLevel,
                                levelDisplayNameByLevel),
                            EarnedCount = earnedCountByUser.GetValueOrDefault(r.UserId),
                            TotalAchievements = totalAchievements,
                            SelectedEmblems = selectedEmblemsByUserId.GetValueOrDefault(r.UserId, [])
                        },
                    Volume = r.Volume,
                    Position = r.Position,
                    PreviousPosition = r.PreviousPosition,
                    PositionChange = r.PositionChange,
                    TotalReferrals = r.TotalReferrals,
                    TotalCommission = r.TotalCommission
                }).ToList(),
                TotalItems = rankingItems.TotalItems,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(rankingItems.TotalItems / (double)pageSize),
                Type = type,
                Period = period,
                Status = type == RankingType.Referral
                    ? await rankingProcessingStatusService.GetReferralStatusAsync(ApiEnvironment.Production, ct)
                    : await rankingProcessingStatusService.GetVolumeStatusAsync(ApiEnvironment.Production, period, ct),
                CalculatedAt = rankingItems.CalculatedAt,
                PeriodStart = rankingItems.PeriodStart,
                PeriodEnd = rankingItems.PeriodEnd
            }
        }, ct);
    }

    private async Task<RankingLoadResult> LoadVolumeRankingItemsAsync(
        RankingPeriod period,
        int page,
        int pageSize,
        CancellationToken ct)
    {
        var query = dbContext.UserRankingCaches
            .AsNoTracking()
            .Where(r => r.Period == period
                && r.Environment == ApiEnvironment.Production
                && (r.User.RankingSuspendedUntil == null || r.User.RankingSuspendedUntil <= DateTime.UtcNow))
            .OrderBy(r => r.Position);

        var totalItems = await query.CountAsync(ct);

        var items = await query
            .Include(r => r.User)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var first = items.FirstOrDefault();

        return new RankingLoadResult
        {
            TotalItems = totalItems,
            CalculatedAt = first?.CalculatedAt,
            PeriodStart = first?.PeriodStart ?? DateTime.UtcNow,
            PeriodEnd = first?.PeriodEnd ?? DateTime.UtcNow,
            Items = items.Select(r => new RankingRowData
            {
                UserId = r.UserId,
                User = r.User,
                Volume = r.Volume,
                Position = r.Position,
                PreviousPosition = r.PreviousPosition,
                PositionChange = r.PositionChange,
                TotalReferrals = 0,
                TotalCommission = 0
            }).ToList()
        };
    }

    private async Task<RankingLoadResult> LoadReferralRankingItemsAsync(
        int page,
        int pageSize,
        CancellationToken ct)
    {
        var query = dbContext.ReferralRankingCaches
            .AsNoTracking()
            .Where(r => r.Environment == ApiEnvironment.Production
                && (r.User.RankingSuspendedUntil == null || r.User.RankingSuspendedUntil <= DateTime.UtcNow))
            .OrderBy(r => r.Position);

        var totalItems = await query.CountAsync(ct);

        var items = await query
            .Include(r => r.User)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var (periodStart, periodEnd) = GetAnnualPeriodRange();

        return new RankingLoadResult
        {
            TotalItems = totalItems,
            CalculatedAt = items.FirstOrDefault()?.CalculatedAt,
            PeriodStart = periodStart,
            PeriodEnd = periodEnd,
            Items = items.Select(r => new RankingRowData
            {
                UserId = r.UserId,
                User = r.User,
                Volume = 0,
                Position = r.Position,
                PreviousPosition = r.PreviousPosition,
                PositionChange = r.PositionChange,
                TotalReferrals = r.TotalReferrals,
                TotalCommission = r.TotalCommission
            }).ToList()
        };
    }

    private static (DateTime start, DateTime end) GetAnnualPeriodRange()
    {
        var brasiliaNow = DateTimeUtils.GetBrasiliaTime();
        var startBrasilia = new DateTime(brasiliaNow.Year, 1, 1);
        var nextStartBrasilia = startBrasilia.AddYears(1);

        var startUtc = TimeZoneInfo.ConvertTimeToUtc(startBrasilia, DateTimeUtils.BrasiliaTimeZone);
        var endUtc = TimeZoneInfo.ConvertTimeToUtc(nextStartBrasilia, DateTimeUtils.BrasiliaTimeZone).AddTicks(-1);

        return (startUtc, endUtc);
    }

    private static PublicProfileLevelInfoData BuildLevelInfoData(
        long totalVolume,
        IAchievementService achievementService,
        Dictionary<MerchantLevel, string?> levelBorderUrlByLevel,
        Dictionary<MerchantLevel, string?> levelDisplayNameByLevel)
    {
        var currentLevel = achievementService.ComputeLevel(totalVolume);
        var progress = achievementService.LevelProgress(totalVolume);
        var currentLevelIndex = (int)currentLevel;
        var currentLevelName = levelDisplayNameByLevel.GetValueOrDefault(currentLevel) ?? currentLevel.ToString();
        var (_, minThreshold, maxThreshold) = UserProgressionConstants.LevelThresholds[currentLevelIndex];

        string? nextLevelKey = null;
        string? nextLevelName = null;
        if (currentLevelIndex < UserProgressionConstants.LevelThresholds.Length - 1)
        {
            var nextLevel = UserProgressionConstants.LevelThresholds[currentLevelIndex + 1].Level;
            nextLevelKey = nextLevel.ToString();
            nextLevelName = levelDisplayNameByLevel.GetValueOrDefault(nextLevel);
        }

        return new PublicProfileLevelInfoData
        {
            Current = currentLevel.ToString(),
            CurrentDisplayName = currentLevelName,
            NextLevel = nextLevelKey,
            NextLevelDisplayName = nextLevelName,
            TotalVolume = totalVolume,
            MinThreshold = minThreshold,
            MaxThreshold = maxThreshold,
            Progress = progress,
            BorderImageUrl = levelBorderUrlByLevel.GetValueOrDefault(currentLevel)
        };
    }

    private sealed class RankingRowData
    {
        public Guid UserId { get; set; }
        public User? User { get; set; }
        public long Volume { get; set; }
        public int Position { get; set; }
        public int? PreviousPosition { get; set; }
        public int PositionChange { get; set; }
        public int TotalReferrals { get; set; }
        public long TotalCommission { get; set; }
    }

    private sealed class RankingLoadResult
    {
        public List<RankingRowData> Items { get; set; } = [];
        public int TotalItems { get; set; }
        public DateTime? CalculatedAt { get; set; }
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
    }
}
