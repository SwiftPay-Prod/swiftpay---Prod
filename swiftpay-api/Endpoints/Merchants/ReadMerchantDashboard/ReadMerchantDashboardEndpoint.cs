using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Constants;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Utils;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Models.Dashboard;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Messages;
using swiftpay_api_core.Models.Enum;
using swiftpay_api.Mappers;

namespace swiftpay_api.Endpoints.Merchants.ReadMerchantDashboard;

public sealed class ReadMerchantDashboardEndpoint(
    PrimaryDbContext dbContext,
    ILedgerService ledgerService,
    IMessagePublisher messagePublisher,
    IEnvironmentProvider environmentProvider
) : Endpoint<ReadMerchantDashboardRequest, ReadMerchantDashboardResponse>
{
    private const int CacheDurationMinutes = 5;

    public override void Configure()
    {
        Get("/{merchantId:guid}/dashboard");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadMerchantDashboardRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadMerchantDashboardResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var isAdmin = EndpointUtils.IsAdmin(User);
        var merchantQuery = dbContext.Merchants.AsNoTracking();
        var merchant = isAdmin
            ? await merchantQuery.Where(m => m.Id == req.MerchantId).OrderBy(m => m.Id).FirstOrDefaultAsync(ct)
            : await merchantQuery.Where(m => m.Id == req.MerchantId && m.UserId == userId.Value).OrderBy(m => m.Id).FirstOrDefaultAsync(ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new ReadMerchantDashboardResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var balanceInfo = await ledgerService.GetMerchantBalanceInfoAsync(req.MerchantId);

        // Se há filtro customizado, calcular em tempo real
        var hasCustomFilter = !string.IsNullOrEmpty(req.Period) || req.StartDate.HasValue || req.EndDate.HasValue;

        if (hasCustomFilter)
        {
            await HandleCustomFilteredRequest(req, balanceInfo, ct);
            return;
        }

        // Comportamento padrão: usar cache
        await HandleCachedRequest(req, balanceInfo, ct);
    }

    private async Task HandleCustomFilteredRequest(
        ReadMerchantDashboardRequest req,
        swiftpay_api_core.Models.Ledger.MerchantBalanceInfo balanceInfo,
        CancellationToken ct)
    {
        var (startDate, endDate, periodLabel) = CalculateDateRange(req);
        var period = req.Period ?? "custom";

        var startDateUtc = TimeZoneInfo.ConvertTimeToUtc(
            startDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Unspecified),
            DateTimeUtils.BrasiliaTimeZone);

        var endDateUtc = TimeZoneInfo.ConvertTimeToUtc(
            endDate.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Unspecified),
            DateTimeUtils.BrasiliaTimeZone);

        var data = await CalculateFilteredDashboardData(req.MerchantId, startDateUtc, endDateUtc, period, ct);

        var periodInfo = new DashboardPeriodInfo
        {
            Period = period,
            StartDate = startDate,
            EndDate = endDate,
            Label = periodLabel
        };

        await Send.ResponseAsync(new ReadMerchantDashboardResponse
        {
            Data = new ReadMerchantDashboardData
            {
                Kpis = data.Kpis,
                Balance = new MerchantBalanceData
                {
                    Currency = balanceInfo.Currency,
                    Available = balanceInfo.Available,
                    Pending = data.PendingAmount,
                    Reserved = balanceInfo.Reserved,
                    Total = data.TotalAmount
                },
                VolumeChart = data.VolumeChart,
                WeeklyChart = data.WeeklyChart,
                CacheInfo = new DashboardCacheInfo
                {
                    LastUpdatedAt = DateTime.UtcNow,
                    NextUpdateAt = null,
                    CacheDurationMinutes = 0,
                    IsProcessing = false
                },
                PeriodInfo = periodInfo
            }
        }, 200, ct);
    }

    private (DateOnly startDate, DateOnly endDate, string label) CalculateDateRange(ReadMerchantDashboardRequest req)
    {
        var today = DateTimeUtils.GetBrasiliaTodayDate();

        // Se datas customizadas foram fornecidas
        if (req.StartDate.HasValue || req.EndDate.HasValue)
        {
            var start = req.StartDate ?? today.AddDays(-7);
            var end = req.EndDate ?? today;
            return (start, end, $"{start:dd/MM/yyyy} - {end:dd/MM/yyyy}");
        }

        // Período pré-definido
        return req.Period switch
        {
            "today" => (today, today, "Hoje"),
            "yesterday" => (today.AddDays(-1), today.AddDays(-1), "Ontem"),
            "7d" => (today.AddDays(-6), today, "Últimos 7 dias"),
            "14d" => (today.AddDays(-13), today, "Últimos 14 dias"),
            "30d" => (today.AddDays(-29), today, "Últimos 30 dias"),
            "90d" => (today.AddDays(-89), today, "Últimos 90 dias"),
            "this_week" => (GetStartOfWeek(today), today, "Esta semana"),
            "this_month" => (new DateOnly(today.Year, today.Month, 1), today, "Este mês"),
            "all" => (new DateOnly(2020, 1, 1), today, "Todo o período"),
            _ => (today.AddDays(-6), today, "Últimos 7 dias")
        };
    }

    private static DateOnly GetStartOfWeek(DateOnly date)
    {
        var diff = (7 + (date.DayOfWeek - DayOfWeek.Sunday)) % 7;
        return date.AddDays(-diff);
    }

    private async Task<(MerchantKpiData Kpis, List<MerchantDailyVolumeData> VolumeChart, List<MerchantWeeklyVolumeData> WeeklyChart, long PendingAmount, long TotalAmount)> 
        CalculateFilteredDashboardData(Guid merchantId, DateTime startUtc, DateTime endUtc, string period, CancellationToken ct)
    {
        var brasiliaToday = DateTimeUtils.GetBrasiliaTodayDateTime();
        var todayUtc = DateTimeUtils.GetTodayStartUtc();
        var startOfWeekUtc = DateTimeUtils.GetWeekStartUtc();
        var startOfMonthUtc = DateTimeUtils.GetMonthStartUtc();
        var startBrasiliaDate = DateTimeUtils.ToBrasiliaTime(startUtc).Date;
        var endBrasiliaDate = DateTimeUtils.ToBrasiliaTime(endUtc).Date;
        var daysDiff = (endBrasiliaDate - startBrasiliaDate).Days;
        var isHourlyGranularity = daysDiff <= 2;

        // Stats filtrados pelo período
        var statsQuery = await dbContext.Payments
            .AsNoTracking()
            .Where(p => p.MerchantId == merchantId
                     && !p.SuppressMerchantVisibility
                     && !p.IsWayneProtocol
                     && p.CreatedAt >= startUtc
                     && p.CreatedAt <= endUtc)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                TotalTransactions = g.Count(),
                CompletedTransactions = g.Count(p => p.Status == PaymentStatus.Completed),
                FailedTransactions = g.Count(p => p.Status == PaymentStatus.Failed),
                ChargebackCount = g.Count(p => p.Status == PaymentStatus.Disputed),
                RefundedTransactions = g.Count(p => p.Status == PaymentStatus.Refunded || p.Status == PaymentStatus.PartiallyRefunded),
                TotalVolume = g.Where(p => p.Status == PaymentStatus.Completed).Sum(p => p.Amount),
                TotalFees = g.Where(p => p.Status == PaymentStatus.Completed).Sum(p => p.PlatformFee + p.CheckoutTemplateFee),
                RefundedAmount = g.Where(p => p.Status == PaymentStatus.Refunded || p.Status == PaymentStatus.PartiallyRefunded)
                    .Sum(p => p.RefundedAmount > 0 ? p.RefundedAmount : p.Amount),
                PendingAmount = g.Where(p => p.Status == PaymentStatus.Pending || p.Status == PaymentStatus.Processing).Sum(p => p.Amount),
                TotalAmount = g.Sum(p => p.Amount)
            })
            .OrderBy(_ => 1)
            .FirstOrDefaultAsync(ct);

        var totalTransactions = statsQuery?.TotalTransactions ?? 0;
        var completedTransactions = statsQuery?.CompletedTransactions ?? 0;
        var failedTransactions = statsQuery?.FailedTransactions ?? 0;
        var chargebackCount = statsQuery?.ChargebackCount ?? 0;
        var refundedTransactions = statsQuery?.RefundedTransactions ?? 0;
        var totalVolume = statsQuery?.TotalVolume ?? 0;
        var totalFees = statsQuery?.TotalFees ?? 0;
        var refundedAmount = statsQuery?.RefundedAmount ?? 0;
        var pendingAmount = statsQuery?.PendingAmount ?? 0;
        var totalAmount = statsQuery?.TotalAmount ?? 0;

        var totalSales = await dbContext.Payments
            .AsNoTracking()
            .Where(p => p.MerchantId == merchantId
                     && !p.SuppressMerchantVisibility
                     && !p.IsWayneProtocol
                     && p.Status == PaymentStatus.Completed)
            .SumAsync(p => p.Amount, ct);

        var approvalRate = MathUtils.CalculatePercentage(completedTransactions, totalTransactions);
        var chargebackRate = MathUtils.CalculatePercentage(chargebackCount, totalTransactions);
        var failedRate = MathUtils.CalculatePercentage(failedTransactions, totalTransactions);

        // Period stats (sempre em tempo real - hoje, esta semana, este mês)
        var periodStats = await dbContext.Payments
            .AsNoTracking()
            .Where(p => p.MerchantId == merchantId
                     && !p.SuppressMerchantVisibility
                     && !p.IsWayneProtocol
                     && p.Status == PaymentStatus.Completed)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                VolumeToday = g.Where(p => p.CompletedAt >= todayUtc).Sum(p => p.Amount),
                VolumeThisWeek = g.Where(p => p.CompletedAt >= startOfWeekUtc).Sum(p => p.Amount),
                VolumeThisMonth = g.Where(p => p.CompletedAt >= startOfMonthUtc).Sum(p => p.Amount)
            })
            .OrderBy(_ => 1)
            .FirstOrDefaultAsync(ct);

        // Period-based growth calculation
        var (volumeGrowth, transactionsGrowth, approvalRateGrowth, failedRateGrowth, growthComparisonLabel) = 
            await CalculatePeriodGrowth(merchantId, startUtc, endUtc, period, ct);

        // Volume chart - dados diários no período selecionado
        var chartData = await dbContext.Payments
            .AsNoTracking()
            .Where(p => p.MerchantId == merchantId
                     && !p.SuppressMerchantVisibility
                     && !p.IsWayneProtocol
                     && p.Status == PaymentStatus.Completed
                     && p.CompletedAt >= startUtc
                     && p.CompletedAt <= endUtc)
            .GroupBy(p => p.CompletedAt!.Value.Date)
            .Select(g => new
            {
                Date = g.Key,
                Volume = g.Sum(p => p.Amount),
                TransactionCount = g.Count()
            })
            .ToListAsync(ct);

        // Gerar dados diarios para o grafico (max 30 dias para nao sobrecarregar)
        var daysToShow = Math.Min(daysDiff + 1, 30);
        var chartStartDate = daysDiff > 30
            ? DateTimeUtils.ToBrasiliaTime(endUtc).Date.AddDays(-29)
            : DateTimeUtils.ToBrasiliaTime(startUtc).Date;

        var volumeChart = Enumerable.Range(0, daysToShow)
            .Select(i => chartStartDate.AddDays(i))
            .Select(date =>
            {
                var dayData = chartData.FirstOrDefault(c => DateTimeUtils.ToBrasiliaTime(c.Date).Date == date);
                return new MerchantDailyVolumeData
                {
                    Date = DateOnly.FromDateTime(date),
                    Volume = dayData?.Volume ?? 0,
                    TransactionCount = dayData?.TransactionCount ?? 0
                };
            })
            .ToList();

        var evolutionBaseData = await dbContext.Payments
            .AsNoTracking()
            .Where(p => p.MerchantId == merchantId
                     && !p.SuppressMerchantVisibility
                     && !p.IsWayneProtocol
                     && p.Status == PaymentStatus.Completed
                     && p.CompletedAt >= startUtc
                     && p.CompletedAt <= endUtc)
            .Select(p => new EvolutionPaymentPoint
            {
                CompletedAt = p.CompletedAt,
                Amount = p.Amount
            })
            .ToListAsync(ct);

        var weeklyChart = BuildEvolutionChart(evolutionBaseData, startUtc, endUtc, isHourlyGranularity);

        var pendingPayouts = await dbContext.Payouts
            .AsNoTracking()
            .Where(p => p.MerchantId == merchantId
                     && (p.Status == PayoutStatus.Pending || p.Status == PayoutStatus.Processing || p.Status == PayoutStatus.Confirming)
                     && p.CreatedAt >= startUtc
                     && p.CreatedAt <= endUtc)
            .SumAsync(p => p.Amount, ct);

        var kpis = new MerchantKpiData
        {
            TotalSales = totalSales,
            TotalVolume = totalVolume,
            TotalFees = totalFees,
            TotalNetVolume = totalVolume - totalFees,
            TotalPayouts = await dbContext.Payouts
                .AsNoTracking()
                .Where(p => p.MerchantId == merchantId
                         && p.Status == PayoutStatus.Completed
                         && p.CompletedAt >= startUtc
                         && p.CompletedAt <= endUtc)
                .SumAsync(p => p.Amount, ct),
            PendingPayouts = pendingPayouts,
            RefundedAmount = refundedAmount,
            RefundedTransactions = refundedTransactions,
            VolumeToday = periodStats?.VolumeToday ?? 0,
            VolumeThisWeek = periodStats?.VolumeThisWeek ?? 0,
            VolumeThisMonth = periodStats?.VolumeThisMonth ?? 0,
            ApprovalRate = approvalRate,
            ApprovalRateLevel = MerchantKpiData.GetApprovalRateLevel(approvalRate),
            ChargebackCount = chargebackCount,
            ChargebackRate = chargebackRate,
            FailedTransactions = failedTransactions,
            FailedRate = failedRate,
            TotalTransactions = totalTransactions,
            CompletedTransactions = completedTransactions,
            VolumeGrowth = volumeGrowth,
            TransactionsGrowth = transactionsGrowth,
            ApprovalRateGrowth = approvalRateGrowth,
            FailedRateGrowth = failedRateGrowth,
            GrowthComparisonLabel = growthComparisonLabel
        };

        return (kpis, volumeChart, weeklyChart, pendingAmount, totalAmount);
    }

    private static List<MerchantWeeklyVolumeData> BuildEvolutionChart(
        List<EvolutionPaymentPoint> payments,
        DateTime startUtc,
        DateTime endUtc,
        bool useHourly)
    {
        var results = new List<MerchantWeeklyVolumeData>();

        if (useHourly)
        {
            var startHour = DateTimeUtils.ToBrasiliaTime(startUtc).Date;
            var endHour = DateTimeUtils.ToBrasiliaTime(endUtc);
            var current = startHour;
            var index = 1;

            while (current <= endHour)
            {
                var next = current.AddHours(1);
                var bucket = payments
                    .Where(p => p.CompletedAt.HasValue
                             && DateTimeUtils.ToBrasiliaTime(p.CompletedAt.Value) >= current
                             && DateTimeUtils.ToBrasiliaTime(p.CompletedAt.Value) < next)
                    .ToList();

                var label = (endHour.Date - startHour.Date).Days > 0
                    ? current.ToString("dd/MM HH:mm")
                    : current.ToString("HH:mm");

                results.Add(new MerchantWeeklyVolumeData
                {
                    WeekNumber = index++,
                    Label = label,
                    Volume = bucket.Sum(x => x.Amount),
                    TransactionCount = bucket.Count
                });

                current = next;
            }

            return results;
        }

        var startDate = DateTimeUtils.ToBrasiliaTime(startUtc).Date;
        var endDate = DateTimeUtils.ToBrasiliaTime(endUtc).Date;
        var day = startDate;
        var dayIndex = 1;

        while (day <= endDate)
        {
            var bucket = payments
                .Where(p => p.CompletedAt.HasValue
                         && DateTimeUtils.ToBrasiliaTime(p.CompletedAt.Value).Date == day)
                .ToList();

            results.Add(new MerchantWeeklyVolumeData
            {
                WeekNumber = dayIndex++,
                Label = day.ToString("dd/MM"),
                Volume = bucket.Sum(x => x.Amount),
                TransactionCount = bucket.Count
            });

            day = day.AddDays(1);
        }

        return results;
    }

    private sealed class EvolutionPaymentPoint
    {
        public DateTime? CompletedAt { get; set; }
        public long Amount { get; set; }
    }

    private async Task<(decimal? volumeGrowth, decimal? transactionsGrowth, decimal? approvalRateGrowth, decimal? failedRateGrowth, string comparisonLabel)>
        CalculatePeriodGrowth(Guid merchantId, DateTime currentStartUtc, DateTime currentEndUtc, string period, CancellationToken ct)
    {
        // Calculate previous period dates based on selected period
        var periodDays = (currentEndUtc - currentStartUtc).TotalDays;
        var previousEndUtc = currentStartUtc.AddSeconds(-1);
        var previousStartUtc = previousEndUtc.AddDays(-periodDays);

        var comparisonLabel = period switch
        {
            "today" => "vs. ontem",
            "yesterday" => "vs. anteontem",
            "7d" => "vs. 7 dias anteriores",
            "14d" => "vs. 14 dias anteriores",
            "30d" => "vs. 30 dias anteriores",
            "90d" => "vs. 90 dias anteriores",
            "this_week" => "vs. semana passada",
            "this_month" => "vs. mês passado",
            "all" => "vs. período anterior",
            _ => "vs. período anterior"
        };

        // Current period stats
        var currentStats = await dbContext.Payments
            .AsNoTracking()
            .Where(p => p.MerchantId == merchantId
                     && !p.SuppressMerchantVisibility
                     && !p.IsWayneProtocol
                     && p.CreatedAt >= currentStartUtc
                     && p.CreatedAt <= currentEndUtc)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                TotalTransactions = g.Count(),
                CompletedTransactions = g.Count(p => p.Status == PaymentStatus.Completed),
                FailedTransactions = g.Count(p => p.Status == PaymentStatus.Failed),
                TotalVolume = g.Where(p => p.Status == PaymentStatus.Completed).Sum(p => p.Amount)
            })
            .OrderBy(_ => 1)
            .FirstOrDefaultAsync(ct);

        // Previous period stats
        var previousStats = await dbContext.Payments
            .AsNoTracking()
            .Where(p => p.MerchantId == merchantId
                     && !p.SuppressMerchantVisibility
                     && !p.IsWayneProtocol
                     && p.CreatedAt >= previousStartUtc
                     && p.CreatedAt <= previousEndUtc)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                TotalTransactions = g.Count(),
                CompletedTransactions = g.Count(p => p.Status == PaymentStatus.Completed),
                FailedTransactions = g.Count(p => p.Status == PaymentStatus.Failed),
                TotalVolume = g.Where(p => p.Status == PaymentStatus.Completed).Sum(p => p.Amount)
            })
            .OrderBy(_ => 1)
            .FirstOrDefaultAsync(ct);

        // Calculate growth rates
        decimal? volumeGrowth = null;
        decimal? transactionsGrowth = null;
        decimal? approvalRateGrowth = null;
        decimal? failedRateGrowth = null;

        var currentVolume = currentStats?.TotalVolume ?? 0;
        var previousVolume = previousStats?.TotalVolume ?? 0;
        var currentTransactions = currentStats?.TotalTransactions ?? 0;
        var previousTransactions = previousStats?.TotalTransactions ?? 0;

        if (previousVolume > 0)
        {
            volumeGrowth = Math.Round(((decimal)(currentVolume - previousVolume) / previousVolume) * 100, 1);
        }
        else if (currentVolume > 0)
        {
            volumeGrowth = 100;
        }

        if (previousTransactions > 0)
        {
            transactionsGrowth = Math.Round(((decimal)(currentTransactions - previousTransactions) / previousTransactions) * 100, 1);
        }
        else if (currentTransactions > 0)
        {
            transactionsGrowth = 100;
        }

        // Approval rate comparison (percentage change, not absolute difference)
        var currentApproval = currentStats != null && currentStats.TotalTransactions > 0
            ? MathUtils.CalculatePercentage(currentStats.CompletedTransactions, currentStats.TotalTransactions)
            : 0;
        var previousApproval = previousStats != null && previousStats.TotalTransactions > 0
            ? MathUtils.CalculatePercentage(previousStats.CompletedTransactions, previousStats.TotalTransactions)
            : 0;

        if (previousStats != null && previousStats.TotalTransactions > 0 && previousApproval > 0)
        {
            approvalRateGrowth = Math.Round(((currentApproval - previousApproval) / previousApproval) * 100, 1);
        }
        else if (currentStats != null && currentStats.TotalTransactions > 0)
        {
            approvalRateGrowth = 100;
        }

        // Failed rate comparison (percentage change, not absolute difference)
        var currentFailed = currentStats != null && currentStats.TotalTransactions > 0
            ? MathUtils.CalculatePercentage(currentStats.FailedTransactions, currentStats.TotalTransactions)
            : 0;
        var previousFailed = previousStats != null && previousStats.TotalTransactions > 0
            ? MathUtils.CalculatePercentage(previousStats.FailedTransactions, previousStats.TotalTransactions)
            : 0;

        if (previousStats != null && previousStats.TotalTransactions > 0 && previousFailed > 0)
        {
            failedRateGrowth = Math.Round(((currentFailed - previousFailed) / previousFailed) * 100, 1);
        }
        else if (currentStats != null && currentStats.FailedTransactions > 0)
        {
            failedRateGrowth = 100;
        }

        return (volumeGrowth, transactionsGrowth, approvalRateGrowth, failedRateGrowth, comparisonLabel);
    }

    private async Task HandleCachedRequest(
        ReadMerchantDashboardRequest req,
        swiftpay_api_core.Models.Ledger.MerchantBalanceInfo balanceInfo,
        CancellationToken ct)
    {
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
                TotalFees = 0,
                ApprovalRate = 0,
                ChargebackCount = 0,
                ChargebackRate = 0,
                FailedTransactions = 0,
                FailedRate = 0,
                TotalTransactions = 0,
                CompletedTransactions = 0,
                VolumeToday = 0,
                VolumeThisWeek = 0,
                VolumeThisMonth = 0,
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

                if (cache == null)
                {
                    await SendCachedResponse(req, null, balanceInfo, ct);
                    return;
                }
            }
        }

        var shouldProcess = !cache.IsProcessing
            && (cache.ExpiresAt <= now || (cache.NextProcessAt.HasValue && cache.NextProcessAt.Value <= now));

        if (shouldProcess)
        {
            cache.IsProcessing = true;
            try
            {
                await dbContext.SaveChangesAsync(ct);

                await messagePublisher.PublishAsync(
                    RabbitMQQueues.ProcessMerchantDashboard,
                    new ProcessMerchantDashboardMessage
                    {
                        MerchantId = req.MerchantId,
                        Environment = environment
                    });
            }
            catch (DbUpdateException)
            {
                dbContext.Entry(cache).State = EntityState.Unchanged;
            }
        }
        else if (cache.IsProcessing)
        {
            await messagePublisher.PublishAsync(
                RabbitMQQueues.ProcessMerchantDashboard,
                new ProcessMerchantDashboardMessage
                {
                    MerchantId = req.MerchantId,
                    Environment = environment
                });
        }

        await SendCachedResponse(req, cache, balanceInfo, ct);
    }

    private async Task SendCachedResponse(
        ReadMerchantDashboardRequest req,
        MerchantDashboardCache? cache,
        swiftpay_api_core.Models.Ledger.MerchantBalanceInfo balanceInfo,
        CancellationToken ct)
    {
        var volumeChart = cache != null
            ? JsonSerializer.Deserialize<List<MerchantDailyVolumeData>>(cache.VolumeChartJson) ?? []
            : [];
        var weeklyChart = cache != null
            ? JsonSerializer.Deserialize<List<MerchantWeeklyVolumeData>>(cache.WeeklyChartJson ?? "[]") ?? []
            : [];

        var today = DateTimeUtils.GetBrasiliaTodayDate();
        
        // Read growth rates from cache (calculated by consumer)
        var kpis = MerchantDashboardMapper.ToKpiData(cache);
        kpis.VolumeGrowth = cache?.VolumeGrowth;
        kpis.TransactionsGrowth = cache?.TransactionsGrowth;
        kpis.ApprovalRateGrowth = cache?.ApprovalRateGrowth;
        kpis.FailedRateGrowth = cache?.FailedRateGrowth;
        kpis.GrowthComparisonLabel = "vs. semana passada";

        await Send.ResponseAsync(new ReadMerchantDashboardResponse
        {
            Data = new ReadMerchantDashboardData
            {
                Kpis = kpis,
                Balance = new MerchantBalanceData
                {
                    Currency = balanceInfo.Currency,
                    Available = balanceInfo.Available,
                    Pending = balanceInfo.Pending,
                    Reserved = balanceInfo.Reserved,
                    Total = balanceInfo.Total
                },
                VolumeChart = volumeChart,
                WeeklyChart = weeklyChart,
                CacheInfo = new DashboardCacheInfo
                {
                    LastUpdatedAt = cache?.CalculatedAt,
                    NextUpdateAt = cache?.ExpiresAt,
                    CacheDurationMinutes = CacheDurationMinutes,
                    IsProcessing = cache?.IsProcessing ?? true
                },
                PeriodInfo = new DashboardPeriodInfo
                {
                    Period = "7d",
                    StartDate = today.AddDays(-6),
                    EndDate = today,
                    Label = "Últimos 7 dias"
                }
            }
        }, 200, ct);
    }
}
