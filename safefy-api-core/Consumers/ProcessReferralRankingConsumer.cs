using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_core.Models.Messages;

namespace safefy_api_core.Consumers;

public sealed class ProcessReferralRankingConsumer(
    IServiceScopeFactory scopeFactory,
    IRankingProcessingStatusService rankingProcessingStatusService,
    ILogger<ProcessReferralRankingConsumer> logger
) : IConsumer<ProcessReferralRankingMessage>
{
    public async Task Consume(ConsumeContext<ProcessReferralRankingMessage> context)
    {
        var environment = context.Message.Environment;

        using var scope = scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();

        try
        {
            await ProcessReferralRankingAsync(dbContext, environment);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to process referral ranking for environment {Environment}", environment);
            throw;
        }
        finally
        {
            await rankingProcessingStatusService.MarkReferralCompletedAsync(environment, context.CancellationToken);
        }
    }

    private static async Task ProcessReferralRankingAsync(PrimaryDbContext dbContext, ApiEnvironment environment)
    {
        var now = DateTime.UtcNow;

        var existingEntries = await LoadAndDeduplicateEntriesAsync(dbContext, environment);

        var referralsByUser = await dbContext.Users
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(u => u.ReferredByUserId != null)
            .GroupBy(u => u.ReferredByUserId!.Value)
            .Select(g => new { UserId = g.Key, TotalReferrals = g.Count() })
            .ToListAsync();

        var commissionByUser = await dbContext.ReferralCommissionBalances
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(b => b.Environment == environment)
            .Select(b => new { UserId = b.ReferrerUserId, TotalCommission = b.TotalGenerated })
            .ToListAsync();

        var referralCountByUser = referralsByUser.ToDictionary(x => x.UserId, x => x.TotalReferrals);
        var commissionTotalByUser = commissionByUser.ToDictionary(x => x.UserId, x => x.TotalCommission);

        var candidateUserIds = referralCountByUser.Keys
            .Concat(commissionTotalByUser.Keys)
            .Distinct()
            .ToList();

        if (candidateUserIds.Count == 0)
        {
            if (existingEntries.Count > 0)
            {
                dbContext.ReferralRankingCaches.RemoveRange(existingEntries);
                await dbContext.SaveChangesAsync();
            }
            return;
        }

        var activeUserIds = await dbContext.Users
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(u => candidateUserIds.Contains(u.Id) && u.Status == UserStatus.Active)
            .Select(u => u.Id)
            .ToListAsync();

        if (activeUserIds.Count == 0)
        {
            if (existingEntries.Count > 0)
            {
                dbContext.ReferralRankingCaches.RemoveRange(existingEntries);
                await dbContext.SaveChangesAsync();
            }
            return;
        }

        var rankingItems = activeUserIds
            .Select(userId => new
            {
                UserId = userId,
                TotalReferrals = referralCountByUser.GetValueOrDefault(userId),
                TotalCommission = commissionTotalByUser.GetValueOrDefault(userId)
            })
            .OrderByDescending(x => x.TotalReferrals)
            .ThenByDescending(x => x.TotalCommission)
            .ThenBy(x => x.UserId)
            .ToList();

        var activeUserSet = activeUserIds.ToHashSet();
        var staleEntries = existingEntries
            .Where(e => !activeUserSet.Contains(e.UserId))
            .ToList();

        if (staleEntries.Count > 0)
        {
            dbContext.ReferralRankingCaches.RemoveRange(staleEntries);
            existingEntries = existingEntries.Except(staleEntries).ToList();
        }

        var existingByUser = existingEntries
            .GroupBy(e => e.UserId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(e => e.CalculatedAt).First());

        var toAdd = new List<ReferralRankingCache>();
        int? previousReferralCount = null;
        long? previousCommission = null;
        var previousPosition = 0;

        for (var i = 0; i < rankingItems.Count; i++)
        {
            var item = rankingItems[i];
            var sameAsPrevious = previousReferralCount.HasValue
                && previousCommission.HasValue
                && previousReferralCount.Value == item.TotalReferrals
                && previousCommission.Value == item.TotalCommission;

            var newPosition = sameAsPrevious ? previousPosition : i + 1;

            if (existingByUser.TryGetValue(item.UserId, out var existing))
            {
                existing.PreviousPosition = existing.Position;
                existing.PositionChange = existing.PreviousPosition.HasValue
                    ? existing.PreviousPosition.Value - newPosition
                    : 0;
                existing.Position = newPosition;
                existing.TotalReferrals = item.TotalReferrals;
                existing.TotalCommission = item.TotalCommission;
                existing.CalculatedAt = now;
            }
            else
            {
                toAdd.Add(new ReferralRankingCache
                {
                    Id = Guid.NewGuid(),
                    UserId = item.UserId,
                    Environment = environment,
                    TotalReferrals = item.TotalReferrals,
                    TotalCommission = item.TotalCommission,
                    Position = newPosition,
                    PreviousPosition = null,
                    PositionChange = 0,
                    CalculatedAt = now,
                    CreatedAt = now,
                    UpdatedAt = now,
                });
            }

            previousReferralCount = item.TotalReferrals;
            previousCommission = item.TotalCommission;
            previousPosition = newPosition;
        }

        if (toAdd.Count > 0)
            dbContext.ReferralRankingCaches.AddRange(toAdd);

        await dbContext.SaveChangesAsync();
    }

    private static async Task<List<ReferralRankingCache>> LoadAndDeduplicateEntriesAsync(
        PrimaryDbContext dbContext,
        ApiEnvironment environment)
    {
        var existingEntries = await dbContext.ReferralRankingCaches
            .IgnoreQueryFilters()
            .Where(r => r.Environment == environment)
            .ToListAsync();

        var duplicateIds = existingEntries
            .GroupBy(e => e.UserId)
            .Where(g => g.Count() > 1)
            .SelectMany(g => g.OrderByDescending(e => e.CalculatedAt).Skip(1))
            .Select(e => e.Id)
            .ToList();

        if (duplicateIds.Count == 0)
            return existingEntries;

        await dbContext.ReferralRankingCaches
            .IgnoreQueryFilters()
            .Where(r => duplicateIds.Contains(r.Id))
            .ExecuteDeleteAsync();

        return existingEntries.Where(e => !duplicateIds.Contains(e.Id)).ToList();
    }
}
