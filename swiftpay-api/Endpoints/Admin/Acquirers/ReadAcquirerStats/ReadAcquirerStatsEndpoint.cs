using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Constants;
using swiftpay_api_core.Models.Messages;
using swiftpay_api.Endpoints.Merchants.ReadMerchantDashboard;

namespace swiftpay_api.Endpoints.Admin.Acquirers.ReadAcquirerStats;

public sealed class ReadAcquirerStatsEndpoint(
    PrimaryDbContext dbContext,
    IConfiguration configuration,
    IMessagePublisher messagePublisher
) : Endpoint<ReadAcquirerStatsRequest, ReadAcquirerStatsResponse>
{
    private const int DefaultCacheDurationMinutes = 15;

    public override void Configure()
    {
        Get("acquirers/{acquirerId:guid}/stats");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ReadAcquirerStatsRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadAcquirerStatsResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var role = EndpointUtils.GetUserRole(User);
        if (role != "God" && role != "Admin")
        {
            await Send.ResponseAsync(new ReadAcquirerStatsResponse
            {
                Error = new("Você não tem permissão para acessar este recurso.")
            }, 403, ct);
            return;
        }

        var acquirerExists = await dbContext.Acquirers
            .AsNoTracking()
            .AnyAsync(a => a.Id == req.AcquirerId, ct);

        if (!acquirerExists)
        {
            await Send.ResponseAsync(new ReadAcquirerStatsResponse
            {
                Error = new("Adquirente não encontrada.")
            }, 404, ct);
            return;
        }

        var cacheDuration = configuration.GetValue("Dashboard:CacheDurationMinutes", DefaultCacheDurationMinutes);
        var now = DateTime.UtcNow;
        var period = req.Period ?? "7d";
        var cachePeriod = BuildCachePeriod(period, req.StartDate, req.EndDate);

        var cache = await dbContext.AcquirerDashboardCaches
            .OrderBy(c => c.Id)
            .FirstOrDefaultAsync(c => c.AcquirerId == req.AcquirerId && c.Period == cachePeriod, ct);

        var shouldProcess = cache == null
            || (cache.ExpiresAt <= now && !cache.IsProcessing)
            || (cache.NextProcessAt.HasValue && cache.NextProcessAt.Value <= now && !cache.IsProcessing);

        if (shouldProcess)
        {
            if (cache == null)
            {
                cache = new AcquirerDashboardCache
                {
                    Id = Guid.CreateVersion7(),
                    AcquirerId = req.AcquirerId,
                    Period = cachePeriod,
                    IsProcessing = true,
                    CalculatedAt = now,
                    ExpiresAt = now.AddMinutes(cacheDuration)
                };
                dbContext.AcquirerDashboardCaches.Add(cache);
            }
            else
            {
                cache.IsProcessing = true;
            }

            await dbContext.SaveChangesAsync(ct);

            await messagePublisher.PublishAsync(
                RabbitMQQueues.ProcessAcquirerDashboard,
                new ProcessAcquirerDashboardMessage
                {
                    AcquirerId = req.AcquirerId,
                    Period = cachePeriod
                });
        }

        await Send.OkAsync(new ReadAcquirerStatsResponse
        {
            Data = MapCacheToData(cache!, cacheDuration)
        }, ct);
    }

    private static string BuildCachePeriod(string period, DateOnly? startDate, DateOnly? endDate)
    {
        if (period == "custom" && startDate.HasValue && endDate.HasValue)
        {
            return $"custom:{startDate.Value:yyyy-MM-dd}:{endDate.Value:yyyy-MM-dd}";
        }

        return period;
    }

    private static AdminAcquirerStatsData MapCacheToData(AcquirerDashboardCache cache, int cacheDuration)
    {
        var volumeChart = new List<AdminAcquirerChartItem>();
        var profitChart = new List<AdminAcquirerChartItem>();

        if (!string.IsNullOrEmpty(cache.VolumeChartJson))
        {
            try
            {
                volumeChart = JsonSerializer.Deserialize<List<AdminAcquirerChartItem>>(cache.VolumeChartJson) ?? [];
            }
            catch
            {
            }
        }

        if (!string.IsNullOrEmpty(cache.ProfitChartJson))
        {
            try
            {
                profitChart = JsonSerializer.Deserialize<List<AdminAcquirerChartItem>>(cache.ProfitChartJson) ?? [];
            }
            catch
            {
            }
        }

        return new AdminAcquirerStatsData
        {
            AcquirerId = cache.AcquirerId,
            Kpis = new AdminAcquirerKpis
            {
                TotalMerchants = cache.TotalMerchants,
                TotalTransactions = cache.TotalTransactions,
                CompletedTransactions = cache.CompletedTransactions,
                FailedTransactions = cache.FailedTransactions,
                ExpiredTransactions = cache.ExpiredTransactions,
                ApprovalRate = cache.ApprovalRate,
                ApprovalRateLevel = MerchantKpiData.GetApprovalRateLevel(cache.ApprovalRate),
                FailureRate = cache.TotalTransactions > 0
                    ? Math.Round((decimal)(cache.FailedTransactions + cache.ExpiredTransactions) / cache.TotalTransactions * 100, 1)
                    : 0,
                TotalVolume = cache.TotalVolume,
                VolumeToday = cache.VolumeToday,
                VolumeThisWeek = cache.VolumeThisWeek,
                VolumeThisMonth = cache.VolumeThisMonth,
                TotalAcquirerFees = cache.TotalAcquirerFees,
                TotalPlatformFees = cache.TotalPlatformFees,
                TotalProfit = cache.TotalProfit,
                TotalPayouts = cache.TotalPayouts,
                TotalPayoutVolume = cache.TotalPayoutVolume,
                TotalPayoutAcquirerFees = cache.TotalPayoutAcquirerFees,
                TotalPayoutPlatformFees = cache.TotalPayoutPlatformFees,
                TotalPayoutProfit = cache.TotalPayoutProfit,
                VolumeGrowth = cache.VolumeGrowth,
                TransactionsGrowth = cache.TransactionsGrowth,
                ApprovalRateGrowth = cache.ApprovalRateGrowth,
                FailedRateGrowth = cache.FailedRateGrowth,
                ProfitGrowth = cache.ProfitGrowth,
                GrowthComparisonLabel = cache.GrowthComparisonLabel
            },
            VolumeChart = volumeChart,
            ProfitChart = profitChart,
            CacheInfo = new AdminAcquirerStatsCacheInfo
            {
                IsProcessing = cache.IsProcessing,
                CalculatedAt = cache.CalculatedAt,
                ExpiresAt = cache.ExpiresAt,
                CacheDurationMinutes = cacheDuration
            },
            PeriodInfo = GetPeriodInfo(cache.Period)
        };
    }

    private static AdminAcquirerPeriodInfo GetPeriodInfo(string period)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        if (TryParseCustomPeriod(period, out var customStartDate, out var customEndDate))
        {
            return new AdminAcquirerPeriodInfo
            {
                Period = "custom",
                StartDate = customStartDate,
                EndDate = customEndDate,
                Label = "Período personalizado"
            };
        }

        return period switch
        {
            "today" => new AdminAcquirerPeriodInfo
            {
                Period = "today",
                StartDate = today,
                EndDate = today,
                Label = "Hoje"
            },
            "yesterday" => new AdminAcquirerPeriodInfo
            {
                Period = "yesterday",
                StartDate = today.AddDays(-1),
                EndDate = today.AddDays(-1),
                Label = "Ontem"
            },
            "7d" => new AdminAcquirerPeriodInfo
            {
                Period = "7d",
                StartDate = today.AddDays(-6),
                EndDate = today,
                Label = "Últimos 7 dias"
            },
            "14d" => new AdminAcquirerPeriodInfo
            {
                Period = "14d",
                StartDate = today.AddDays(-13),
                EndDate = today,
                Label = "Últimos 14 dias"
            },
            "30d" => new AdminAcquirerPeriodInfo
            {
                Period = "30d",
                StartDate = today.AddDays(-29),
                EndDate = today,
                Label = "Últimos 30 dias"
            },
            "90d" => new AdminAcquirerPeriodInfo
            {
                Period = "90d",
                StartDate = today.AddDays(-89),
                EndDate = today,
                Label = "Últimos 90 dias"
            },
            "this_week" => new AdminAcquirerPeriodInfo
            {
                Period = "this_week",
                StartDate = today.AddDays(-(int)today.DayOfWeek),
                EndDate = today,
                Label = "Esta semana"
            },
            "this_month" => new AdminAcquirerPeriodInfo
            {
                Period = "this_month",
                StartDate = new DateOnly(today.Year, today.Month, 1),
                EndDate = today,
                Label = "Este mês"
            },
            "all" => new AdminAcquirerPeriodInfo
            {
                Period = "all",
                StartDate = new DateOnly(2020, 1, 1),
                EndDate = today,
                Label = "Todo o período"
            },
            _ => new AdminAcquirerPeriodInfo
            {
                Period = "7d",
                StartDate = today.AddDays(-6),
                EndDate = today,
                Label = "Últimos 7 dias"
            }
        };
    }

    private static bool TryParseCustomPeriod(string period, out DateOnly startDate, out DateOnly endDate)
    {
        startDate = default;
        endDate = default;

        if (!period.StartsWith("custom:", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var parts = period.Split(':');
        if (parts.Length != 3)
        {
            return false;
        }

        if (!DateOnly.TryParse(parts[1], out startDate) || !DateOnly.TryParse(parts[2], out endDate))
        {
            return false;
        }

        return startDate <= endDate;
    }
}
