using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Constants;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Dashboard;
using safefy_api.EndpointsGroups;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Messages;

namespace safefy_api.Endpoints.Admin.Merchants.ReadMerchantDashboard;

public sealed class AdminReadMerchantDashboardEndpoint(
    PrimaryDbContext dbContext,
    ILedgerService ledgerService,
    IMessagePublisher messagePublisher,
    IEnvironmentProvider environmentProvider
) : Endpoint<AdminReadMerchantDashboardRequest, AdminReadMerchantDashboardResponse>
{
    private const int CacheDurationMinutes = 5;

    public override void Configure()
    {
        Get("/merchant/{merchantId:guid}/dashboard");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(AdminReadMerchantDashboardRequest req, CancellationToken ct)
    {
        var merchant = await dbContext.Merchants
            .AsNoTracking()
            .Where(m => m.Id == req.MerchantId)
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new AdminReadMerchantDashboardResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var now = DateTime.UtcNow;
        var environment = environmentProvider.CurrentEnvironment;

        var cache = await dbContext.MerchantDashboardCaches
            .Where(c => c.MerchantId == req.MerchantId)
            .OrderBy(c => c.Id)
            .FirstOrDefaultAsync(ct);

        if (cache == null)
        {
            cache = new MerchantDashboardCache
            {
                Id = Guid.NewGuid(),
                MerchantId = req.MerchantId,
                Environment = environment,
                TotalVolume = 0,
                VolumeToday = 0,
                VolumeThisWeek = 0,
                VolumeThisMonth = 0,
                TotalFees = 0,
                TotalTransactions = 0,
                CompletedTransactions = 0,
                FailedTransactions = 0,
                ChargebackCount = 0,
                ChargebackRate = 0,
                ApprovalRate = 0,
                FailedRate = 0,
                VolumeChartJson = "[]",
                WeeklyChartJson = "[]",
                CalculatedAt = now,
                ExpiresAt = now,
                IsProcessing = true,
                NextProcessAt = null
            };

            try
            {
                dbContext.MerchantDashboardCaches.Add(cache);
                await dbContext.SaveChangesAsync(ct);
            }
            catch (DbUpdateException)
            {
                dbContext.Entry(cache).State = EntityState.Detached;
                cache = await dbContext.MerchantDashboardCaches
                    .Where(c => c.MerchantId == req.MerchantId)
                    .OrderBy(c => c.Id)
                    .FirstOrDefaultAsync(ct);
            }
        }

        var balanceInfo = await ledgerService.GetMerchantBalanceInfoAsync(req.MerchantId);

        var shouldProcess = cache != null
            && ((cache.ExpiresAt <= now && !cache.IsProcessing)
                || (cache.NextProcessAt.HasValue && cache.NextProcessAt.Value <= now && !cache.IsProcessing));

        if (shouldProcess && cache != null)
        {
            cache.IsProcessing = true;
            await dbContext.SaveChangesAsync(ct);

            await messagePublisher.PublishAsync(
                RabbitMQQueues.ProcessMerchantDashboard,
                new ProcessMerchantDashboardMessage
                {
                    MerchantId = req.MerchantId,
                    Environment = environment
                });
        }

        await SendCachedResponse(cache, balanceInfo, ct);
    }

    private async Task SendCachedResponse(
        MerchantDashboardCache? cache,
        safefy_api_core.Models.Ledger.MerchantBalanceInfo balanceInfo,
        CancellationToken ct)
    {
        var volumeChart = cache != null
            ? JsonSerializer.Deserialize<List<AdminMerchantDailyVolumeData>>(cache.VolumeChartJson) ?? []
            : [];

        await Send.ResponseAsync(new AdminReadMerchantDashboardResponse
        {
            Data = new AdminReadMerchantDashboardData
            {
                Kpis = new AdminMerchantKpiData
                {
                    TotalVolume = balanceInfo.LifetimeVolume,
                    TotalFees = balanceInfo.LifetimeFeesPaid,
                    ApprovalRate = cache?.ApprovalRate ?? 0,
                    ChargebackCount = cache?.ChargebackCount ?? 0,
                    ChargebackRate = cache?.ChargebackRate ?? 0,
                    FailedTransactions = cache?.FailedTransactions ?? 0,
                    FailedRate = cache?.FailedRate ?? 0,
                    TotalTransactions = cache?.TotalTransactions ?? 0,
                    CompletedTransactions = cache?.CompletedTransactions ?? 0,
                    VolumeToday = balanceInfo.VolumeToday,
                    VolumeThisWeek = balanceInfo.VolumeThisWeek,
                    VolumeThisMonth = balanceInfo.VolumeThisMonth
                },
                Balance = new AdminMerchantBalanceData
                {
                    Currency = balanceInfo.Currency,
                    Available = balanceInfo.Available,
                    Pending = balanceInfo.Pending,
                    Reserved = balanceInfo.Reserved,
                    Total = balanceInfo.Total
                },
                VolumeChart = volumeChart,
                CacheInfo = new AdminMerchantDashboardCacheInfo
                {
                    LastUpdatedAt = cache?.CalculatedAt,
                    NextUpdateAt = cache?.ExpiresAt,
                    CacheDurationMinutes = CacheDurationMinutes,
                    IsProcessing = cache?.IsProcessing ?? false
                }
            }
        }, 200, ct);
    }
}
