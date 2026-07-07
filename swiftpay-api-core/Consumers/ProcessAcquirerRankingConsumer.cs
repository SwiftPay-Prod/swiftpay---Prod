using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Models.Messages;
using swiftpay_api_core.Utils;

namespace swiftpay_api_core.Consumers;

public sealed class ProcessAcquirerRankingConsumer(
    IServiceScopeFactory scopeFactory,
    IRankingProcessingStatusService rankingProcessingStatusService,
    ILogger<ProcessAcquirerRankingConsumer> logger
) : IConsumer<ProcessAcquirerRankingMessage>
{
    private const int RankingSampleSize = 1000;

    public async Task Consume(ConsumeContext<ProcessAcquirerRankingMessage> context)
    {
        var environment = context.Message.Environment;

        using var scope = scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();

        try
        {
            await ProcessAcquirerRankingAsync(dbContext, environment);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to process acquirer ranking for environment {Environment}", environment);
            throw;
        }
        finally
        {
            await rankingProcessingStatusService.MarkAcquirerCompletedAsync(environment, context.CancellationToken);
        }
    }

    private static async Task ProcessAcquirerRankingAsync(PrimaryDbContext dbContext, ApiEnvironment environment)
    {
        var now = DateTime.UtcNow;

        var acquirers = await dbContext.Acquirers
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Select(a => a.Id)
            .ToListAsync();

        var merchantAcquirerMap = await dbContext.MerchantAcquirers
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Select(ma => new { ma.AcquirerId, ma.Id })
            .ToListAsync();

        var merchantAcquirerIdsByAcquirer = merchantAcquirerMap
            .GroupBy(x => x.AcquirerId)
            .ToDictionary(g => g.Key, g => g.Select(x => x.Id).ToList());

        var rankingRows = new List<AcquirerRankingRow>();

        foreach (var acquirerId in acquirers)
        {
            if (!merchantAcquirerIdsByAcquirer.TryGetValue(acquirerId, out var merchantAcquirerIds)
                || merchantAcquirerIds.Count == 0)
            {
                continue;
            }

            var sampledStatuses = await dbContext.Payments
                .IgnoreQueryFilters()
                .AsNoTracking()
                .Where(p => p.Environment == environment)
                .Where(p => merchantAcquirerIds.Contains(p.MerchantAcquirerId))
                .OrderByDescending(p => p.CreatedAt)
                .ThenByDescending(p => p.Id)
                .Select(p => p.Status)
                .Take(RankingSampleSize)
                .ToListAsync();

            var analyzedTransactions = sampledStatuses.Count;
            if (analyzedTransactions == 0)
            {
                continue;
            }

            var approvedTransactions = sampledStatuses.Count(status => status == PaymentStatus.Completed);
            var failedTransactions = sampledStatuses.Count(
                status => status == PaymentStatus.Failed
                          || status == PaymentStatus.Cancelled
                          || status == PaymentStatus.Expired);

            var scoreResult = AcquirerRankingScoreCalculator.Calculate(
                approvedTransactions,
                analyzedTransactions,
                failedTransactions,
                RankingSampleSize);

            rankingRows.Add(new AcquirerRankingRow
            {
                AcquirerId = acquirerId,
                ApprovalRate = scoreResult.ApprovalRate,
                ApprovedTransactions = approvedTransactions,
                FailedTransactions = failedTransactions,
                AnalyzedTransactions = analyzedTransactions,
                Score = scoreResult.Score
            });
        }

        var orderedRows = rankingRows
            .OrderByDescending(x => x.Score)
            .ThenByDescending(x => x.ApprovalRate)
            .ThenByDescending(x => x.AnalyzedTransactions)
            .ThenBy(x => x.AcquirerId)
            .ToList();

        var existingEntries = await LoadAndDeduplicateEntriesAsync(dbContext, environment);
        var existingByAcquirer = existingEntries
            .GroupBy(e => e.AcquirerId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(e => e.CalculatedAt).First());

        var rankedAcquirerIds = orderedRows.Select(x => x.AcquirerId).ToHashSet();
        var staleEntries = existingEntries
            .Where(e => !rankedAcquirerIds.Contains(e.AcquirerId))
            .ToList();

        if (staleEntries.Count > 0)
        {
            dbContext.AcquirerRankingCaches.RemoveRange(staleEntries);
        }

        var toAdd = new List<AcquirerRankingCache>();

        for (var index = 0; index < orderedRows.Count; index++)
        {
            var row = orderedRows[index];
            var position = index + 1;

            if (existingByAcquirer.TryGetValue(row.AcquirerId, out var existing))
            {
                existing.SampleSize = Math.Min(RankingSampleSize, row.AnalyzedTransactions);
                existing.Position = position;
                existing.ApprovalRate = row.ApprovalRate;
                existing.ApprovedTransactions = row.ApprovedTransactions;
                existing.RejectedTransactions = row.FailedTransactions;
                existing.AnalyzedTransactions = row.AnalyzedTransactions;
                existing.CalculatedAt = now;
                existing.UpdatedAt = now;
            }
            else
            {
                toAdd.Add(new AcquirerRankingCache
                {
                    Id = Guid.NewGuid(),
                    AcquirerId = row.AcquirerId,
                    Environment = environment,
                    SampleSize = Math.Min(RankingSampleSize, row.AnalyzedTransactions),
                    Position = position,
                    ApprovalRate = row.ApprovalRate,
                    ApprovedTransactions = row.ApprovedTransactions,
                    RejectedTransactions = row.FailedTransactions,
                    AnalyzedTransactions = row.AnalyzedTransactions,
                    CalculatedAt = now,
                    CreatedAt = now,
                    UpdatedAt = now
                });
            }
        }

        if (toAdd.Count > 0)
        {
            dbContext.AcquirerRankingCaches.AddRange(toAdd);
        }

        await dbContext.SaveChangesAsync();
    }

    private static async Task<List<AcquirerRankingCache>> LoadAndDeduplicateEntriesAsync(
        PrimaryDbContext dbContext,
        ApiEnvironment environment)
    {
        var existingEntries = await dbContext.AcquirerRankingCaches
            .IgnoreQueryFilters()
            .Where(r => r.Environment == environment)
            .ToListAsync();

        var duplicateIds = existingEntries
            .GroupBy(e => e.AcquirerId)
            .Where(g => g.Count() > 1)
            .SelectMany(g => g.OrderByDescending(e => e.CalculatedAt).Skip(1))
            .Select(e => e.Id)
            .ToList();

        if (duplicateIds.Count == 0)
        {
            return existingEntries;
        }

        await dbContext.AcquirerRankingCaches
            .IgnoreQueryFilters()
            .Where(r => duplicateIds.Contains(r.Id))
            .ExecuteDeleteAsync();

        return existingEntries.Where(e => !duplicateIds.Contains(e.Id)).ToList();
    }

    private sealed class AcquirerRankingRow
    {
        public Guid AcquirerId { get; set; }
        public decimal ApprovalRate { get; set; }
        public int ApprovedTransactions { get; set; }
        public int FailedTransactions { get; set; }
        public int AnalyzedTransactions { get; set; }
        public int Score { get; set; }
    }
}