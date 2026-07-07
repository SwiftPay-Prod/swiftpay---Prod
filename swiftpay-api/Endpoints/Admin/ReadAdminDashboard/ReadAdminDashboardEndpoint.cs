using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Constants;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Models.Dashboard;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Messages;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Utils;
using swiftpay_api.Mappers;

namespace swiftpay_api.Endpoints.Admin.ReadAdminDashboard;

public sealed class ReadAdminDashboardEndpoint(
    PrimaryDbContext dbContext,
    IMessagePublisher messagePublisher,
    IEnvironmentProvider environmentProvider
) : Endpoint<ReadAdminDashboardRequest, ReadAdminDashboardResponse>
{
    private const int CacheDurationMinutes = 5;

    public override void Configure()
    {
        Get("/dashboard");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ReadAdminDashboardRequest req, CancellationToken ct)
    {
        if (HasCustomFilter(req))
        {
            await HandleFilteredRequest(req, ct);
            return;
        }

        var now = DateTime.UtcNow;
        var environment = environmentProvider.CurrentEnvironment;

        var cache = await dbContext.AdminDashboardCaches
            .Where(c => c.Environment == environment)
            .OrderBy(c => c.Id)
            .FirstOrDefaultAsync(ct);

        if (cache == null)
        {
            cache = new AdminDashboardCache
            {
                Id = Guid.NewGuid(),
                Environment = environment,
                TotalUsers = 0,
                ActiveUsers = 0,
                InactiveUsers = 0,
                SuspendedUsers = 0,
                EmailVerifiedUsers = 0,
                NewUsersToday = 0,
                NewUsersThisWeek = 0,
                NewUsersThisMonth = 0,
                TotalMerchants = 0,
                ActiveMerchants = 0,
                DraftMerchants = 0,
                SuspendedMerchants = 0,
                PendingKycMerchants = 0,
                ApprovedKycMerchants = 0,
                RejectedKycMerchants = 0,
                NewMerchantsThisMonth = 0,
                TotalVolume = 0,
                TotalFees = 0,
                VolumeToday = 0,
                FeesToday = 0,
                VolumeThisWeek = 0,
                FeesThisWeek = 0,
                VolumeThisMonth = 0,
                FeesThisMonth = 0,
                TotalTransactions = 0,
                CompletedTransactions = 0,
                FailedTransactions = 0,
                PendingTransactions = 0,
                ApprovalRate = 0,
                TotalPayouts = 0,
                TotalPayoutAmount = 0,
                PayoutFeesTotal = 0,
                PayoutAcquirerFeesTotal = 0,
                PayoutFeesToday = 0,
                PayoutAcquirerFeesToday = 0,
                PayoutFeesThisWeek = 0,
                PayoutAcquirerFeesThisWeek = 0,
                PayoutFeesThisMonth = 0,
                PayoutAcquirerFeesThisMonth = 0,
                VolumeChartJson = "[]",
                RegistrationChartJson = "[]",
                CalculatedAt = now,
                ExpiresAt = now,
                IsProcessing = true,
                NextProcessAt = null
            };
            dbContext.AdminDashboardCaches.Add(cache);
            await dbContext.SaveChangesAsync(ct);

            await messagePublisher.PublishAsync(
                RabbitMQQueues.ProcessAdminDashboard,
                new ProcessAdminDashboardMessage { Environment = environment });

            await SendCachedResponse(cache, ct);
            return;
        }

        var shouldProcess = !cache.IsProcessing
            && (cache.ExpiresAt <= now || (cache.NextProcessAt.HasValue && cache.NextProcessAt.Value <= now));

        if (shouldProcess)
        {
            cache.IsProcessing = true;
            await dbContext.SaveChangesAsync(ct);

            await messagePublisher.PublishAsync(
                RabbitMQQueues.ProcessAdminDashboard,
                new ProcessAdminDashboardMessage { Environment = environment });
        }
        else if (cache.IsProcessing)
        {
            await messagePublisher.PublishAsync(
                RabbitMQQueues.ProcessAdminDashboard,
                new ProcessAdminDashboardMessage { Environment = environment });
        }

        await SendCachedResponse(cache, ct);
    }

    private static bool HasCustomFilter(ReadAdminDashboardRequest req)
        => !string.IsNullOrWhiteSpace(req.Period) || req.StartDate.HasValue || req.EndDate.HasValue;

    private async Task HandleFilteredRequest(ReadAdminDashboardRequest req, CancellationToken ct)
    {
        var (startDate, endDate, period, label) = CalculateDateRange(req);

        var startUtc = TimeZoneInfo.ConvertTimeToUtc(
            startDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Unspecified),
            DateTimeUtils.BrasiliaTimeZone);

        var endUtc = TimeZoneInfo.ConvertTimeToUtc(
            endDate.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Unspecified),
            DateTimeUtils.BrasiliaTimeZone);

        var snapshot = await CalculateSnapshotAsync(startUtc, endUtc, ct);
        var growth = await CalculateGrowthAsync(snapshot, startUtc, endUtc, period, ct);
        var volumeChart = await CalculateVolumeChartAsync(startUtc, endUtc, ct);
        var registrationChart = await CalculateRegistrationChartAsync(startUtc, endUtc, ct);

        var periodInfo = new AdminDashboardPeriodInfo
        {
            Period = period,
            StartDate = startDate,
            EndDate = endDate,
            Label = label
        };

        await Send.ResponseAsync(new ReadAdminDashboardResponse
        {
            Data = AdminDashboardMapper.ToFilteredData(
                snapshot.Users,
                snapshot.Merchants,
                snapshot.Financial,
                volumeChart,
                registrationChart,
                periodInfo,
                growth,
                DateTime.UtcNow)
        }, 200, ct);
    }

    private static (DateOnly startDate, DateOnly endDate, string period, string label) CalculateDateRange(ReadAdminDashboardRequest req)
    {
        var today = DateTimeUtils.GetBrasiliaTodayDate();

        if (req.StartDate.HasValue || req.EndDate.HasValue)
        {
            var start = req.StartDate ?? today.AddDays(-6);
            var end = req.EndDate ?? today;
            return (start, end, req.Period ?? "custom", $"{start:dd/MM/yyyy} - {end:dd/MM/yyyy}");
        }

        return req.Period switch
        {
            "today" => (today, today, "today", "Hoje"),
            "yesterday" => (today.AddDays(-1), today.AddDays(-1), "yesterday", "Ontem"),
            "7d" => (today.AddDays(-6), today, "7d", "Ultimos 7 dias"),
            "14d" => (today.AddDays(-13), today, "14d", "Ultimos 14 dias"),
            "30d" => (today.AddDays(-29), today, "30d", "Ultimos 30 dias"),
            "90d" => (today.AddDays(-89), today, "90d", "Ultimos 90 dias"),
            "this_week" => (GetStartOfWeek(today), today, "this_week", "Esta semana"),
            "this_month" => (new DateOnly(today.Year, today.Month, 1), today, "this_month", "Este mes"),
            "all" => (new DateOnly(2020, 1, 1), today, "all", "Todo o periodo"),
            "custom" => (today.AddDays(-6), today, "custom", "Periodo personalizado"),
            _ => (today.AddDays(-6), today, "7d", "Ultimos 7 dias")
        };
    }

    private static DateOnly GetStartOfWeek(DateOnly date)
    {
        var diff = (7 + (date.DayOfWeek - DayOfWeek.Sunday)) % 7;
        return date.AddDays(-diff);
    }

    private async Task<AdminDashboardSnapshot> CalculateSnapshotAsync(DateTime startUtc, DateTime endUtc, CancellationToken ct)
    {
        var periodEndDate = DateOnly.FromDateTime(DateTimeUtils.ToBrasiliaTime(endUtc));
        var todayStartUtc = TimeZoneInfo.ConvertTimeToUtc(
            periodEndDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Unspecified),
            DateTimeUtils.BrasiliaTimeZone);

        var weekStartDate = GetStartOfWeek(periodEndDate);
        var weekStartUtc = TimeZoneInfo.ConvertTimeToUtc(
            weekStartDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Unspecified),
            DateTimeUtils.BrasiliaTimeZone);

        var monthStartDate = new DateOnly(periodEndDate.Year, periodEndDate.Month, 1);
        var monthStartUtc = TimeZoneInfo.ConvertTimeToUtc(
            monthStartDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Unspecified),
            DateTimeUtils.BrasiliaTimeZone);

        var usersStats = await dbContext.Users
            .AsNoTracking()
            .Where(u => u.CreatedAt >= startUtc && u.CreatedAt <= endUtc)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                TotalUsers = g.Count(),
                ActiveUsers = g.Count(u => u.Status == UserStatus.Active),
                InactiveUsers = g.Count(u => u.Status == UserStatus.Inactive),
                SuspendedUsers = g.Count(u => u.Status == UserStatus.Suspended),
                EmailVerifiedUsers = g.Count(u => u.EmailVerified),
                NewUsersToday = g.Count(u => u.CreatedAt >= todayStartUtc),
                NewUsersThisWeek = g.Count(u => u.CreatedAt >= weekStartUtc),
                NewUsersThisMonth = g.Count(u => u.CreatedAt >= monthStartUtc)
            })
            .OrderBy(_ => 1)
            .FirstOrDefaultAsync(ct);

        var merchantsStats = await dbContext.Merchants
            .AsNoTracking()
            .Where(m => m.CreatedAt >= startUtc && m.CreatedAt <= endUtc)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                TotalMerchants = g.Count(),
                ActiveMerchants = g.Count(m => m.Status == MerchantStatus.Active),
                DraftMerchants = g.Count(m => m.Status == MerchantStatus.Draft),
                SuspendedMerchants = g.Count(m => m.Status == MerchantStatus.Suspended),
                PendingKycMerchants = g.Count(m => m.KycStatus == MerchantKycStatus.Pending || m.KycStatus == MerchantKycStatus.UnderReview),
                ApprovedKycMerchants = g.Count(m => m.KycStatus == MerchantKycStatus.Approved),
                RejectedKycMerchants = g.Count(m => m.KycStatus == MerchantKycStatus.Rejected),
                NewMerchantsThisMonth = g.Count(m => m.CreatedAt >= monthStartUtc)
            })
            .OrderBy(_ => 1)
            .FirstOrDefaultAsync(ct);

        var transactionStats = await dbContext.Payments
            .AsNoTracking()
            .Where(p => p.CreatedAt >= startUtc && p.CreatedAt <= endUtc)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                TotalTransactions = g.Count(),
                CompletedTransactions = g.Count(p => p.Status == PaymentStatus.Completed),
                FailedTransactions = g.Count(p => p.Status == PaymentStatus.Failed || p.Status == PaymentStatus.Cancelled || p.Status == PaymentStatus.Expired),
                PendingTransactions = g.Count(p => p.Status == PaymentStatus.Pending || p.Status == PaymentStatus.Processing)
            })
            .OrderBy(_ => 1)
            .FirstOrDefaultAsync(ct);

        var paymentRevenueStats = await dbContext.Payments
            .AsNoTracking()
            .Where(p => p.Status == PaymentStatus.Completed && p.CompletedAt >= startUtc && p.CompletedAt <= endUtc)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                TotalVolume = g.Sum(p => p.Amount),
                TotalFees = g.Sum(p => p.PlatformFee + p.CheckoutTemplateFee),
                TotalAcquirerFees = g.Sum(p => p.AcquirerFee),
                VolumeToday = g.Where(p => p.CompletedAt >= todayStartUtc).Sum(p => p.Amount),
                FeesToday = g.Where(p => p.CompletedAt >= todayStartUtc).Sum(p => p.PlatformFee + p.CheckoutTemplateFee),
                AcquirerFeesToday = g.Where(p => p.CompletedAt >= todayStartUtc).Sum(p => p.AcquirerFee),
                VolumeThisWeek = g.Where(p => p.CompletedAt >= weekStartUtc).Sum(p => p.Amount),
                FeesThisWeek = g.Where(p => p.CompletedAt >= weekStartUtc).Sum(p => p.PlatformFee + p.CheckoutTemplateFee),
                AcquirerFeesThisWeek = g.Where(p => p.CompletedAt >= weekStartUtc).Sum(p => p.AcquirerFee),
                VolumeThisMonth = g.Where(p => p.CompletedAt >= monthStartUtc).Sum(p => p.Amount),
                FeesThisMonth = g.Where(p => p.CompletedAt >= monthStartUtc).Sum(p => p.PlatformFee + p.CheckoutTemplateFee),
                AcquirerFeesThisMonth = g.Where(p => p.CompletedAt >= monthStartUtc).Sum(p => p.AcquirerFee)
            })
            .OrderBy(_ => 1)
            .FirstOrDefaultAsync(ct);

        var payoutStats = await dbContext.Payouts
            .AsNoTracking()
            .Where(p => p.Status == PayoutStatus.Completed && p.CompletedAt >= startUtc && p.CompletedAt <= endUtc)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                TotalPayouts = g.Count(),
                TotalPayoutAmount = g.Sum(p => p.Amount),
                TotalPayoutFees = g.Sum(p => p.PlatformFee),
                TotalPayoutAcquirerFees = g.Sum(p => p.AcquirerFee),
                PayoutFeesToday = g.Where(p => p.CompletedAt >= todayStartUtc).Sum(p => p.PlatformFee),
                PayoutAcquirerFeesToday = g.Where(p => p.CompletedAt >= todayStartUtc).Sum(p => p.AcquirerFee),
                PayoutFeesThisWeek = g.Where(p => p.CompletedAt >= weekStartUtc).Sum(p => p.PlatformFee),
                PayoutAcquirerFeesThisWeek = g.Where(p => p.CompletedAt >= weekStartUtc).Sum(p => p.AcquirerFee),
                PayoutFeesThisMonth = g.Where(p => p.CompletedAt >= monthStartUtc).Sum(p => p.PlatformFee),
                PayoutAcquirerFeesThisMonth = g.Where(p => p.CompletedAt >= monthStartUtc).Sum(p => p.AcquirerFee)
            })
            .OrderBy(_ => 1)
            .FirstOrDefaultAsync(ct);

        var totalTransactions = transactionStats?.TotalTransactions ?? 0;
        var completedTransactions = transactionStats?.CompletedTransactions ?? 0;
        var failedTransactions = transactionStats?.FailedTransactions ?? 0;
        var approvalRate = MathUtils.CalculatePercentage(completedTransactions, totalTransactions);
        var failedRate = MathUtils.CalculatePercentage(failedTransactions, totalTransactions);

        var totalFees = (paymentRevenueStats?.TotalFees ?? 0) + (payoutStats?.TotalPayoutFees ?? 0);
        var totalAcquirerFees = (paymentRevenueStats?.TotalAcquirerFees ?? 0) + (payoutStats?.TotalPayoutAcquirerFees ?? 0);
        var totalNetRevenue = totalFees - totalAcquirerFees;

        var feesToday = (paymentRevenueStats?.FeesToday ?? 0) + (payoutStats?.PayoutFeesToday ?? 0);
        var acquirerFeesToday = (paymentRevenueStats?.AcquirerFeesToday ?? 0) + (payoutStats?.PayoutAcquirerFeesToday ?? 0);
        var feesThisWeek = (paymentRevenueStats?.FeesThisWeek ?? 0) + (payoutStats?.PayoutFeesThisWeek ?? 0);
        var acquirerFeesThisWeek = (paymentRevenueStats?.AcquirerFeesThisWeek ?? 0) + (payoutStats?.PayoutAcquirerFeesThisWeek ?? 0);
        var feesThisMonth = (paymentRevenueStats?.FeesThisMonth ?? 0) + (payoutStats?.PayoutFeesThisMonth ?? 0);
        var acquirerFeesThisMonth = (paymentRevenueStats?.AcquirerFeesThisMonth ?? 0) + (payoutStats?.PayoutAcquirerFeesThisMonth ?? 0);

        var users = new AdminUserKpis
        {
            TotalUsers = usersStats?.TotalUsers ?? 0,
            ActiveUsers = usersStats?.ActiveUsers ?? 0,
            InactiveUsers = usersStats?.InactiveUsers ?? 0,
            SuspendedUsers = usersStats?.SuspendedUsers ?? 0,
            EmailVerifiedUsers = usersStats?.EmailVerifiedUsers ?? 0,
            NewUsersToday = usersStats?.NewUsersToday ?? 0,
            NewUsersThisWeek = usersStats?.NewUsersThisWeek ?? 0,
            NewUsersThisMonth = usersStats?.NewUsersThisMonth ?? 0
        };

        var merchants = new AdminMerchantKpis
        {
            TotalMerchants = merchantsStats?.TotalMerchants ?? 0,
            ActiveMerchants = merchantsStats?.ActiveMerchants ?? 0,
            DraftMerchants = merchantsStats?.DraftMerchants ?? 0,
            SuspendedMerchants = merchantsStats?.SuspendedMerchants ?? 0,
            PendingKycMerchants = merchantsStats?.PendingKycMerchants ?? 0,
            ApprovedKycMerchants = merchantsStats?.ApprovedKycMerchants ?? 0,
            RejectedKycMerchants = merchantsStats?.RejectedKycMerchants ?? 0,
            NewMerchantsThisMonth = merchantsStats?.NewMerchantsThisMonth ?? 0
        };

        var financial = new AdminFinancialKpis
        {
            TotalVolume = paymentRevenueStats?.TotalVolume ?? 0,
            TotalFees = totalFees,
            TotalAcquirerFees = totalAcquirerFees,
            TotalNetRevenue = totalNetRevenue,
            VolumeToday = paymentRevenueStats?.VolumeToday ?? 0,
            FeesToday = feesToday,
            AcquirerFeesToday = acquirerFeesToday,
            NetRevenueToday = feesToday - acquirerFeesToday,
            VolumeThisWeek = paymentRevenueStats?.VolumeThisWeek ?? 0,
            FeesThisWeek = feesThisWeek,
            AcquirerFeesThisWeek = acquirerFeesThisWeek,
            NetRevenueThisWeek = feesThisWeek - acquirerFeesThisWeek,
            VolumeThisMonth = paymentRevenueStats?.VolumeThisMonth ?? 0,
            FeesThisMonth = feesThisMonth,
            AcquirerFeesThisMonth = acquirerFeesThisMonth,
            NetRevenueThisMonth = feesThisMonth - acquirerFeesThisMonth,
            TotalTransactions = totalTransactions,
            CompletedTransactions = completedTransactions,
            FailedTransactions = failedTransactions,
            PendingTransactions = transactionStats?.PendingTransactions ?? 0,
            ApprovalRate = approvalRate,
            FailedRate = failedRate,
            NetMarginPercentage = (paymentRevenueStats?.TotalVolume ?? 0) > 0
                ? Math.Round((totalNetRevenue / (decimal)(paymentRevenueStats?.TotalVolume ?? 0)) * 100, 2)
                : 0,
            TotalPayouts = payoutStats?.TotalPayouts ?? 0,
            TotalPayoutAmount = payoutStats?.TotalPayoutAmount ?? 0,
            TotalPayoutFees = payoutStats?.TotalPayoutFees ?? 0,
            TotalPayoutAcquirerFees = payoutStats?.TotalPayoutAcquirerFees ?? 0
        };

        return new AdminDashboardSnapshot(users, merchants, financial);
    }

    private async Task<List<AdminDailyVolumeData>> CalculateVolumeChartAsync(DateTime startUtc, DateTime endUtc, CancellationToken ct)
    {
        var startDate = DateOnly.FromDateTime(DateTimeUtils.ToBrasiliaTime(startUtc));
        var endDate = DateOnly.FromDateTime(DateTimeUtils.ToBrasiliaTime(endUtc));
        var daySpan = Math.Max(0, endDate.DayNumber - startDate.DayNumber);
        var daysToShow = Math.Min(daySpan + 1, 30);
        var chartStartDate = daySpan > 29 ? endDate.AddDays(-29) : startDate;

        var chartStartUtc = TimeZoneInfo.ConvertTimeToUtc(
            chartStartDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Unspecified),
            DateTimeUtils.BrasiliaTimeZone);

        var paymentRevenueByDay = await dbContext.Payments
            .AsNoTracking()
            .Where(p => p.Status == PaymentStatus.Completed && p.CompletedAt >= chartStartUtc && p.CompletedAt <= endUtc)
            .GroupBy(p => p.CompletedAt!.Value.Date)
            .Select(g => new
            {
                Date = g.Key,
                Volume = g.Sum(p => p.Amount),
                Fees = g.Sum(p => p.PlatformFee + p.CheckoutTemplateFee),
                AcquirerFees = g.Sum(p => p.AcquirerFee),
                CompletedTransactions = g.Count()
            })
            .ToListAsync(ct);

        var payoutFeesByDay = await dbContext.Payouts
            .AsNoTracking()
            .Where(p => p.Status == PayoutStatus.Completed && p.CompletedAt >= chartStartUtc && p.CompletedAt <= endUtc)
            .GroupBy(p => p.CompletedAt!.Value.Date)
            .Select(g => new
            {
                Date = g.Key,
                PayoutFees = g.Sum(p => p.PlatformFee),
                PayoutAcquirerFees = g.Sum(p => p.AcquirerFee)
            })
            .ToListAsync(ct);

        var transactionStatusByDay = await dbContext.Payments
            .AsNoTracking()
            .Where(p => p.CreatedAt >= chartStartUtc && p.CreatedAt <= endUtc)
            .GroupBy(p => p.CreatedAt.Date)
            .Select(g => new
            {
                Date = g.Key,
                TotalTransactions = g.Count(),
                CompletedTransactions = g.Count(p => p.Status == PaymentStatus.Completed),
                FailedTransactions = g.Count(p => p.Status == PaymentStatus.Failed || p.Status == PaymentStatus.Cancelled || p.Status == PaymentStatus.Expired)
            })
            .ToListAsync(ct);

        return Enumerable.Range(0, daysToShow)
            .Select(i => chartStartDate.AddDays(i))
            .Select(date =>
            {
                var paymentDay = paymentRevenueByDay.FirstOrDefault(d => DateOnly.FromDateTime(DateTimeUtils.ToBrasiliaTime(d.Date)) == date);
                var payoutDay = payoutFeesByDay.FirstOrDefault(d => DateOnly.FromDateTime(DateTimeUtils.ToBrasiliaTime(d.Date)) == date);
                var transactionsDay = transactionStatusByDay.FirstOrDefault(d => DateOnly.FromDateTime(DateTimeUtils.ToBrasiliaTime(d.Date)) == date);

                return new AdminDailyVolumeData
                {
                    Date = date,
                    Volume = paymentDay?.Volume ?? 0,
                    Fees = paymentDay?.Fees ?? 0,
                    AcquirerFees = paymentDay?.AcquirerFees ?? 0,
                    PayoutFees = payoutDay?.PayoutFees ?? 0,
                    PayoutAcquirerFees = payoutDay?.PayoutAcquirerFees ?? 0,
                    TransactionCount = transactionsDay?.TotalTransactions ?? 0,
                    CompletedTransactions = transactionsDay?.CompletedTransactions ?? paymentDay?.CompletedTransactions ?? 0,
                    FailedTransactions = transactionsDay?.FailedTransactions ?? 0
                };
            })
            .ToList();
    }

    private async Task<List<AdminDailyRegistrationData>> CalculateRegistrationChartAsync(DateTime startUtc, DateTime endUtc, CancellationToken ct)
    {
        var startDate = DateOnly.FromDateTime(DateTimeUtils.ToBrasiliaTime(startUtc));
        var endDate = DateOnly.FromDateTime(DateTimeUtils.ToBrasiliaTime(endUtc));
        var daySpan = Math.Max(0, endDate.DayNumber - startDate.DayNumber);
        var daysToShow = Math.Min(daySpan + 1, 30);
        var chartStartDate = daySpan > 29 ? endDate.AddDays(-29) : startDate;

        var chartStartUtc = TimeZoneInfo.ConvertTimeToUtc(
            chartStartDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Unspecified),
            DateTimeUtils.BrasiliaTimeZone);

        var usersByDay = await dbContext.Users
            .AsNoTracking()
            .Where(u => u.CreatedAt >= chartStartUtc && u.CreatedAt <= endUtc)
            .GroupBy(u => u.CreatedAt.Date)
            .Select(g => new
            {
                Date = g.Key,
                Count = g.Count()
            })
            .ToListAsync(ct);

        var merchantsByDay = await dbContext.Merchants
            .AsNoTracking()
            .Where(m => m.CreatedAt >= chartStartUtc && m.CreatedAt <= endUtc)
            .GroupBy(m => m.CreatedAt.Date)
            .Select(g => new
            {
                Date = g.Key,
                Count = g.Count()
            })
            .ToListAsync(ct);

        return Enumerable.Range(0, daysToShow)
            .Select(i => chartStartDate.AddDays(i))
            .Select(date => new AdminDailyRegistrationData
            {
                Date = date,
                NewUsers = usersByDay.FirstOrDefault(d => DateOnly.FromDateTime(DateTimeUtils.ToBrasiliaTime(d.Date)) == date)?.Count ?? 0,
                NewMerchants = merchantsByDay.FirstOrDefault(d => DateOnly.FromDateTime(DateTimeUtils.ToBrasiliaTime(d.Date)) == date)?.Count ?? 0
            })
            .ToList();
    }

    private async Task<AdminDashboardGrowthKpis> CalculateGrowthAsync(
        AdminDashboardSnapshot current,
        DateTime currentStartUtc,
        DateTime currentEndUtc,
        string period,
        CancellationToken ct)
    {
        var durationSeconds = Math.Max(1, (currentEndUtc - currentStartUtc).TotalSeconds);
        var previousEndUtc = currentStartUtc.AddSeconds(-1);
        var previousStartUtc = previousEndUtc.AddSeconds(-durationSeconds);

        var previous = await CalculateSnapshotAsync(previousStartUtc, previousEndUtc, ct);

        var currentRegistrations = current.Users.TotalUsers + current.Merchants.TotalMerchants;
        var previousRegistrations = previous.Users.TotalUsers + previous.Merchants.TotalMerchants;

        return new AdminDashboardGrowthKpis
        {
            VolumeGrowth = CalculateGrowth(current.Financial.TotalVolume, previous.Financial.TotalVolume),
            TotalFeesGrowth = CalculateGrowth(current.Financial.TotalFees, previous.Financial.TotalFees),
            TotalAcquirerFeesGrowth = CalculateGrowth(current.Financial.TotalAcquirerFees, previous.Financial.TotalAcquirerFees),
            NetRevenueGrowth = CalculateGrowth(current.Financial.TotalNetRevenue, previous.Financial.TotalNetRevenue),
            NetMarginGrowth = CalculateGrowth(current.Financial.NetMarginPercentage, previous.Financial.NetMarginPercentage),
            TransactionsGrowth = CalculateGrowth(current.Financial.TotalTransactions, previous.Financial.TotalTransactions),
            ApprovalRateGrowth = CalculateGrowth(current.Financial.ApprovalRate, previous.Financial.ApprovalRate),
            FailedRateGrowth = CalculateGrowth(current.Financial.FailedRate, previous.Financial.FailedRate),
            PayoutAmountGrowth = CalculateGrowth(current.Financial.TotalPayoutAmount, previous.Financial.TotalPayoutAmount),
            PayoutsGrowth = CalculateGrowth(current.Financial.TotalPayouts, previous.Financial.TotalPayouts),
            UsersGrowth = CalculateGrowth(current.Users.TotalUsers, previous.Users.TotalUsers),
            MerchantsGrowth = CalculateGrowth(current.Merchants.TotalMerchants, previous.Merchants.TotalMerchants),
            ActiveUsersGrowth = CalculateGrowth(current.Users.ActiveUsers, previous.Users.ActiveUsers),
            ActiveMerchantsGrowth = CalculateGrowth(current.Merchants.ActiveMerchants, previous.Merchants.ActiveMerchants),
            PendingKycGrowth = CalculateGrowth(current.Merchants.PendingKycMerchants, previous.Merchants.PendingKycMerchants),
            NewUsersGrowth = CalculateGrowth(current.Users.NewUsersToday, previous.Users.NewUsersToday),
            NewMerchantsGrowth = CalculateGrowth(current.Merchants.NewMerchantsThisMonth, previous.Merchants.NewMerchantsThisMonth),
            RegistrationsGrowth = CalculateGrowth(currentRegistrations, previousRegistrations),
            GrowthComparisonLabel = GetGrowthComparisonLabel(period)
        };
    }

    private static decimal? CalculateGrowth(long current, long previous)
    {
        if (previous > 0)
        {
            return Math.Round(((current - previous) / (decimal)previous) * 100, 1);
        }

        if (current > 0)
        {
            return 100;
        }

        return null;
    }

    private static decimal? CalculateGrowth(decimal current, decimal previous)
    {
        if (previous > 0)
        {
            return Math.Round(((current - previous) / previous) * 100, 1);
        }

        if (current > 0)
        {
            return 100;
        }

        return null;
    }

    private static string GetGrowthComparisonLabel(string period) => period switch
    {
        "today" => "vs. ontem",
        "yesterday" => "vs. anteontem",
        "7d" => "vs. 7 dias anteriores",
        "14d" => "vs. 14 dias anteriores",
        "30d" => "vs. 30 dias anteriores",
        "90d" => "vs. 90 dias anteriores",
        "this_week" => "vs. semana passada",
        "this_month" => "vs. mes passado",
        "all" => "vs. periodo anterior equivalente",
        _ => "vs. periodo anterior equivalente"
    };

    private async Task SendCachedResponse(AdminDashboardCache? cache, CancellationToken ct)
    {
        var volumeChart = cache != null
            ? JsonSerializer.Deserialize<List<AdminDailyVolumeData>>(cache.VolumeChartJson) ?? []
            : [];
        var registrationChart = cache != null
            ? JsonSerializer.Deserialize<List<AdminDailyRegistrationData>>(cache.RegistrationChartJson) ?? []
            : [];

        await Send.ResponseAsync(new ReadAdminDashboardResponse
        {
            Data = AdminDashboardMapper.ToData(
                cache,
                volumeChart,
                registrationChart,
                CacheDurationMinutes,
                AdminDashboardMapper.ToDefaultPeriodInfo(),
                new AdminDashboardGrowthKpis { GrowthComparisonLabel = "vs. semana passada" })
        }, 200, ct);
    }

    private sealed record AdminDashboardSnapshot(
        AdminUserKpis Users,
        AdminMerchantKpis Merchants,
        AdminFinancialKpis Financial);
}
