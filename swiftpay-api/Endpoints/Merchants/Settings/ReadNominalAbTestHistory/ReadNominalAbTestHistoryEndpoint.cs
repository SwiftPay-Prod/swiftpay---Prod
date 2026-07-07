using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Merchants.Settings.ReadNominalAbTestHistory;

public sealed class ReadNominalAbTestHistoryEndpoint(
    PrimaryDbContext dbContext,
    IEnvironmentProvider environmentProvider
) : Endpoint<ReadNominalAbTestHistoryRequest, ReadNominalAbTestHistoryResponse>
{
    public override void Configure()
    {
        Get("{merchantId:guid}/nominals/ab-test/history");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadNominalAbTestHistoryRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadNominalAbTestHistoryResponse
            {
                Error = new("Token invalido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId.Value, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new ReadNominalAbTestHistoryResponse
            {
                Error = new("Organizacao nao encontrada.")
            }, 404, ct);
            return;
        }

        var environment = environmentProvider.CurrentEnvironment;
        var now = DateTime.UtcNow;

        var tests = await dbContext.MerchantNominalAbTests
            .AsNoTracking()
            .Where(t => t.MerchantId == req.MerchantId && t.Environment == environment)
            .OrderByDescending(t => t.StartedAt)
            .Take(20)
            .ToListAsync(ct);

        if (tests.Count == 0)
        {
            await Send.OkAsync(new ReadNominalAbTestHistoryResponse
            {
                Data = new ReadNominalAbTestHistoryData()
            }, ct);
            return;
        }

        var merchantAcquirerIds = tests
            .SelectMany(t => new[] { t.VariantAMerchantAcquirerId, t.VariantBMerchantAcquirerId, t.WinnerMerchantAcquirerId })
            .Where(id => id.HasValue)
            .Select(id => id!.Value)
            .Distinct()
            .ToList();

        var merchantAcquirers = await dbContext.MerchantAcquirers
            .AsNoTracking()
            .Include(ma => ma.Acquirer)
            .Where(ma => ma.MerchantId == req.MerchantId && merchantAcquirerIds.Contains(ma.Id))
            .ToListAsync(ct);

        var merchantAcquirerMap = merchantAcquirers.ToDictionary(ma => ma.Id, ma => ma);
        var minStart = tests.Min(t => t.StartedAt);
        var maxEnd = tests.Max(t => t.EndedAt ?? now);

        var testVariantIds = tests
            .SelectMany(t => new[] { t.VariantAMerchantAcquirerId, t.VariantBMerchantAcquirerId })
            .Distinct()
            .ToList();

        var payments = await dbContext.Payments
            .AsNoTracking()
            .Where(p => p.MerchantId == req.MerchantId
                && testVariantIds.Contains(p.MerchantAcquirerId)
                && p.CreatedAt >= minStart
                && p.CreatedAt <= maxEnd)
            .Select(p => new PaymentSnapshot
            {
                MerchantAcquirerId = p.MerchantAcquirerId,
                CreatedAt = p.CreatedAt,
                Status = p.Status
            })
            .ToListAsync(ct);

        var items = new List<MerchantNominalAbTestHistoryItem>(tests.Count);

        foreach (var test in tests)
        {
            if (!merchantAcquirerMap.TryGetValue(test.VariantAMerchantAcquirerId, out var variantA))
            {
                continue;
            }

            if (!merchantAcquirerMap.TryGetValue(test.VariantBMerchantAcquirerId, out var variantB))
            {
                continue;
            }

            var testEnd = test.EndedAt ?? now;
            var testPayments = payments
                .Where(p => p.CreatedAt >= test.StartedAt && p.CreatedAt <= testEnd)
                .ToList();

            var variantAPayments = testPayments.Where(p => p.MerchantAcquirerId == test.VariantAMerchantAcquirerId).ToList();
            var variantBPayments = testPayments.Where(p => p.MerchantAcquirerId == test.VariantBMerchantAcquirerId).ToList();

            var variantATotal = variantAPayments.Count;
            var variantAApproved = variantAPayments.Count(p => p.Status == PaymentStatus.Completed);
            var variantBTotal = variantBPayments.Count;
            var variantBApproved = variantBPayments.Count(p => p.Status == PaymentStatus.Completed);

            var chart = BuildHourlyChart(
                test.StartedAt,
                testEnd,
                variantAPayments,
                variantBPayments);

            items.Add(new MerchantNominalAbTestHistoryItem
            {
                Id = test.Id,
                IsActive = test.IsActive,
                StartedAt = test.StartedAt,
                EndedAt = test.EndedAt,
                IsAutoFinished = test.IsAutoFinished,
                EndReason = test.EndReason,
                WinnerMerchantAcquirerId = test.WinnerMerchantAcquirerId,
                LimitType = test.LimitType,
                MaxDurationDays = test.MaxDurationDays,
                MaxTransactions = test.MaxTransactions,
                VariantA = new MerchantNominalAbTestVariantStats
                {
                    MerchantAcquirerId = variantA.Id,
                    AcquirerId = variantA.AcquirerId,
                    DisplayLabel = variantA.Acquirer.Nominal ?? string.Empty,
                    TotalTransactions = variantATotal,
                    ApprovedTransactions = variantAApproved,
                    ApprovalRate = CalculateApprovalRate(variantAApproved, variantATotal)
                },
                VariantB = new MerchantNominalAbTestVariantStats
                {
                    MerchantAcquirerId = variantB.Id,
                    AcquirerId = variantB.AcquirerId,
                    DisplayLabel = variantB.Acquirer.Nominal ?? string.Empty,
                    TotalTransactions = variantBTotal,
                    ApprovedTransactions = variantBApproved,
                    ApprovalRate = CalculateApprovalRate(variantBApproved, variantBTotal)
                },
                Chart = chart
            });
        }

        await Send.OkAsync(new ReadNominalAbTestHistoryResponse
        {
            Data = new ReadNominalAbTestHistoryData
            {
                Items = items
            }
        }, ct);
    }

    private static List<MerchantNominalAbTestChartPoint> BuildHourlyChart(
        DateTime startedAt,
        DateTime endedAt,
        List<PaymentSnapshot> variantAPayments,
        List<PaymentSnapshot> variantBPayments)
    {
        var startedHour = TruncateHour(startedAt);
        var endedHour = TruncateHour(endedAt);

        var variantAGrouped = variantAPayments
            .GroupBy(p => TruncateHour(p.CreatedAt))
            .ToDictionary(
                g => g.Key,
                g => new
                {
                    Total = g.Count(),
                    Approved = g.Count(x => x.Status == PaymentStatus.Completed)
                });

        var variantBGrouped = variantBPayments
            .GroupBy(p => TruncateHour(p.CreatedAt))
            .ToDictionary(
                g => g.Key,
                g => new
                {
                    Total = g.Count(),
                    Approved = g.Count(x => x.Status == PaymentStatus.Completed)
                });

        var points = new List<MerchantNominalAbTestChartPoint>();

        for (var cursor = startedHour; cursor <= endedHour; cursor = cursor.AddHours(1))
        {
            var a = variantAGrouped.TryGetValue(cursor, out var aStats) ? aStats : null;
            var b = variantBGrouped.TryGetValue(cursor, out var bStats) ? bStats : null;

            var brasiliaHour = DateTimeUtils.ToBrasiliaTime(cursor);

            points.Add(new MerchantNominalAbTestChartPoint
            {
                HourUtc = cursor,
                Label = brasiliaHour.ToString("dd/MM HH:mm"),
                VariantATotal = a?.Total ?? 0,
                VariantAApproved = a?.Approved ?? 0,
                VariantAApprovalRate = CalculateApprovalRate(a?.Approved ?? 0, a?.Total ?? 0),
                VariantBTotal = b?.Total ?? 0,
                VariantBApproved = b?.Approved ?? 0,
                VariantBApprovalRate = CalculateApprovalRate(b?.Approved ?? 0, b?.Total ?? 0)
            });
        }

        return points;
    }

    private static decimal CalculateApprovalRate(long approved, long total)
    {
        if (total <= 0)
        {
            return 0;
        }

        return Math.Round((decimal)approved / total * 100, 1);
    }

    private static DateTime TruncateHour(DateTime value)
    {
        return new DateTime(value.Year, value.Month, value.Day, value.Hour, 0, 0, DateTimeKind.Utc);
    }

    private sealed class PaymentSnapshot
    {
        public Guid MerchantAcquirerId { get; set; }
        public DateTime CreatedAt { get; set; }
        public PaymentStatus Status { get; set; }
    }
}
