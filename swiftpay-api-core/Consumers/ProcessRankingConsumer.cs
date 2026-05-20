using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_core.Models.Messages;
using safefy_api_core.Utils;

namespace safefy_api_core.Consumers;

public sealed class ProcessRankingConsumer(
    IServiceScopeFactory scopeFactory,
    IRankingProcessingStatusService rankingProcessingStatusService,
    ILogger<ProcessRankingConsumer> logger
) : IConsumer<ProcessRankingMessage>
{
    public async Task Consume(ConsumeContext<ProcessRankingMessage> context)
    {
        var environment = context.Message.Environment;
        var period = context.Message.Period;

        using var scope = scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();

        try
        {
            await ProcessVolumeRankingAsync(dbContext, environment, period);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to process ranking for period {Period} environment {Environment}", period, environment);
            throw;
        }
        finally
        {
            await rankingProcessingStatusService.MarkVolumeCompletedAsync(environment, period, context.CancellationToken);
        }
    }

    private static async Task ProcessVolumeRankingAsync(PrimaryDbContext dbContext, ApiEnvironment environment, RankingPeriod period)
    {
        var (periodStart, periodFilterEnd, periodDisplayEnd) = GetPeriodRange(period);
        var now = DateTime.UtcNow;

        var merchantToUser = await dbContext.Merchants
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(m => m.Status == MerchantStatus.Active
                     && m.KycStatus == MerchantKycStatus.Approved
                     && m.DeletedAt == null)
            .Select(m => new { m.Id, m.UserId })
            .ToDictionaryAsync(m => m.Id, m => m.UserId);

        var volumeByMerchant = await dbContext.Payments
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(p => p.Status == PaymentStatus.Completed
                     && p.Environment == environment
                     && p.CompletedAt >= periodStart
                     && p.CompletedAt < periodFilterEnd)
            .GroupBy(p => p.MerchantId)
            .Select(g => new { MerchantId = g.Key, Volume = g.Sum(p => p.Amount) })
            .ToListAsync();

        var volumeByUserDictionary = volumeByMerchant
            .Where(x => merchantToUser.ContainsKey(x.MerchantId))
            .GroupBy(x => merchantToUser[x.MerchantId])
            .ToDictionary(g => g.Key, g => g.Sum(x => x.Volume));

        var existingEntries = await LoadAndDeduplicateEntriesAsync(dbContext, period, environment);

        var eligibleUserIds = merchantToUser.Values
            .Distinct()
            .ToList();

        var eligibleUserSet = eligibleUserIds.ToHashSet();

        var staleEntries = existingEntries
            .Where(e => !eligibleUserSet.Contains(e.UserId))
            .ToList();

        if (staleEntries.Count > 0)
        {
            dbContext.UserRankingCaches.RemoveRange(staleEntries);
            existingEntries = existingEntries.Except(staleEntries).ToList();
        }

        var existingByUser = existingEntries
            .GroupBy(e => e.UserId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(e => e.CalculatedAt).First());

        var rankingUserIds = eligibleUserIds;

        var volumeByUser = rankingUserIds
            .Select(userId => new
            {
                UserId = userId,
                Volume = volumeByUserDictionary.GetValueOrDefault(userId)
            })
            .OrderByDescending(x => x.Volume)
            .ThenBy(x => x.UserId)
            .ToList();

        if (volumeByUser.Count == 0)
            return;

        var toAdd = new List<UserRankingCache>();

        long? previousVolume = null;
        var previousPosition = 0;

        for (var i = 0; i < volumeByUser.Count; i++)
        {
            var item = volumeByUser[i];
            var newPosition = previousVolume.HasValue && previousVolume.Value == item.Volume
                ? previousPosition
                : i + 1;

            if (existingByUser.TryGetValue(item.UserId, out var existing))
            {
                // Only snapshot PreviousPosition when the period rolls over.
                // Within the same period, keep it stable so PositionChange always
                // reflects movement since the start of the period, not just since
                // the last 5-minute computation run.
                if (existing.PeriodStart != periodStart)
                {
                    existing.PreviousPosition = existing.Position;
                }

                existing.PositionChange = existing.PreviousPosition.HasValue
                    ? existing.PreviousPosition.Value - newPosition
                    : 0;
                existing.Position = newPosition;
                existing.Volume = item.Volume;
                existing.PeriodStart = periodStart;
                existing.PeriodEnd = periodDisplayEnd;
                existing.CalculatedAt = now;
            }
            else
            {
                toAdd.Add(new UserRankingCache
                {
                    Id = Guid.NewGuid(),
                    UserId = item.UserId,
                    Period = period,
                    Environment = environment,
                    Volume = item.Volume,
                    Position = newPosition,
                    PreviousPosition = null,
                    PositionChange = 0,
                    PeriodStart = periodStart,
                    PeriodEnd = periodDisplayEnd,
                    CalculatedAt = now,
                    CreatedAt = now,
                    UpdatedAt = now,
                });
            }

            previousVolume = item.Volume;
            previousPosition = newPosition;
        }

        if (toAdd.Count > 0)
            dbContext.UserRankingCaches.AddRange(toAdd);

        await dbContext.SaveChangesAsync();
    }

    private static async Task<List<UserRankingCache>> LoadAndDeduplicateEntriesAsync(
        PrimaryDbContext dbContext,
        RankingPeriod period,
        ApiEnvironment environment)
    {
        var existingEntries = await dbContext.UserRankingCaches
            .IgnoreQueryFilters()
            .Where(r => r.Period == period && r.Environment == environment)
            .ToListAsync();

        var duplicateIds = existingEntries
            .GroupBy(e => e.UserId)
            .Where(g => g.Count() > 1)
            .SelectMany(g => g.OrderByDescending(e => e.CalculatedAt).Skip(1))
            .Select(e => e.Id)
            .ToList();

        if (duplicateIds.Count == 0)
            return existingEntries;

        await dbContext.UserRankingCaches
            .IgnoreQueryFilters()
            .Where(r => duplicateIds.Contains(r.Id))
            .ExecuteDeleteAsync();

        return existingEntries.Where(e => !duplicateIds.Contains(e.Id)).ToList();
    }

    private static (DateTime start, DateTime filterEnd, DateTime displayEnd) GetPeriodRange(RankingPeriod period)
    {
        var nowUtc = DateTime.UtcNow;
        var brasiliaNow = DateTimeUtils.GetBrasiliaTime();

        DateTime startBrasilia;
        DateTime nextStartBrasilia;

        switch (period)
        {
            case RankingPeriod.Weekly:
                startBrasilia = brasiliaNow.Date.AddDays(-(int)brasiliaNow.DayOfWeek);
                nextStartBrasilia = startBrasilia.AddDays(7);
                break;
            case RankingPeriod.Monthly:
                startBrasilia = new DateTime(brasiliaNow.Year, brasiliaNow.Month, 1);
                nextStartBrasilia = startBrasilia.AddMonths(1);
                break;
            case RankingPeriod.Annual:
                startBrasilia = new DateTime(brasiliaNow.Year, 1, 1);
                nextStartBrasilia = startBrasilia.AddYears(1);
                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(period), period, null);
        }

        var startUtc = TimeZoneInfo.ConvertTimeToUtc(startBrasilia, DateTimeUtils.BrasiliaTimeZone);
        var nextStartUtc = TimeZoneInfo.ConvertTimeToUtc(nextStartBrasilia, DateTimeUtils.BrasiliaTimeZone);
        var displayEndUtc = nextStartUtc.AddTicks(-1);
        var filterEndUtc = nowUtc < nextStartUtc ? nowUtc : nextStartUtc;

        return (startUtc, filterEndUtc, displayEndUtc);
    }
}
