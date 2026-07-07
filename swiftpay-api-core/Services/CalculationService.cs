using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Calculation;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Constants;
using swiftpay_api_core.Utils;

namespace swiftpay_api_core.Services;

public sealed class CalculationService(PrimaryDbContext dbContext) : ICalculationService
{
    public async Task<Dictionary<Guid, long>> GetPaymentProfitByAcquirerAsync(ApiEnvironment environment, CancellationToken ct = default)
    {
        return await dbContext.Payments
            .AsNoTracking()
            .Where(p => p.Status == PaymentStatus.Completed
                     && p.Environment == environment
                     && p.AcquirerId.HasValue)
            .GroupBy(p => p.AcquirerId!.Value)
            .Select(g => new { AcquirerId = g.Key, Profit = g.Sum(p => p.PlatformFee - p.AcquirerFee) })
            .ToDictionaryAsync(x => x.AcquirerId, x => x.Profit, ct);
    }

    public async Task<Dictionary<Guid, long>> GetPayoutProfitByAcquirerAsync(ApiEnvironment environment, CancellationToken ct = default)
    {
        return await dbContext.Payouts
            .AsNoTracking()
            .Where(p => p.Status == PayoutStatus.Completed && p.Environment == environment)
            .Include(p => p.MerchantAcquirer)
            .GroupBy(p => p.MerchantAcquirer.AcquirerId)
            .Select(g => new { AcquirerId = g.Key, Profit = g.Sum(p => p.PlatformFee - p.AcquirerFee) })
            .ToDictionaryAsync(x => x.AcquirerId, x => x.Profit, ct);
    }

    public async Task<Dictionary<Guid, long>> GetAcquirerFeesFromPaymentsByAcquirerAsync(ApiEnvironment environment, CancellationToken ct = default)
    {
        return await dbContext.Payments
            .AsNoTracking()
            .Where(p => p.Status == PaymentStatus.Completed
                     && p.Environment == environment
                     && p.AcquirerId.HasValue)
            .GroupBy(p => p.AcquirerId!.Value)
            .Select(g => new { AcquirerId = g.Key, TotalFees = g.Sum(p => p.AcquirerFee) })
            .ToDictionaryAsync(x => x.AcquirerId, x => x.TotalFees, ct);
    }

    public async Task<Dictionary<Guid, long>> GetCompletedPlatformPayoutsByAcquirerAsync(
        ApiEnvironment environment,
        IReadOnlyList<Guid>? acquirerIds = null,
        CancellationToken ct = default)
    {
        var query = dbContext.PlatformPayoutItems
            .AsNoTracking()
            .Where(i => i.Status == PlatformPayoutItemStatus.Completed
                        && i.PlatformPayout.Environment == environment);

        if (acquirerIds is { Count: > 0 })
            query = query.Where(i => acquirerIds.Contains(i.AcquirerId));

        return await query
            .GroupBy(i => i.AcquirerId)
            .Select(g => new { AcquirerId = g.Key, Total = g.Sum(i => i.Amount) })
            .ToDictionaryAsync(x => x.AcquirerId, x => x.Total, ct);
    }

    public async Task<Dictionary<Guid, long>> GetProcessingPlatformPayoutsByAcquirerAsync(
        ApiEnvironment environment,
        IReadOnlyList<Guid>? acquirerIds = null,
        CancellationToken ct = default)
    {
        var query = dbContext.PlatformPayoutItems
            .AsNoTracking()
            .Where(i => i.Status == PlatformPayoutItemStatus.Processing
                        && i.PlatformPayout.Environment == environment);

        if (acquirerIds is { Count: > 0 })
            query = query.Where(i => acquirerIds.Contains(i.AcquirerId));

        return await query
            .GroupBy(i => i.AcquirerId)
            .Select(g => new { AcquirerId = g.Key, Total = g.Sum(i => i.Amount) })
            .ToDictionaryAsync(x => x.AcquirerId, x => x.Total, ct);
    }

    public async Task<Dictionary<Guid, long>> GetPlatformProfitByAcquirerAsync(
        ApiEnvironment environment,
        CancellationToken ct = default)
    {
        var acquirerBalances = await GetCurrentAcquirerBalanceSnapshotsAsync(null, environment, ct);

        return acquirerBalances.ToDictionary(
            x => x.Key,
            x => CalculatePlatformProfit(x.Value.GrossBalance, x.Value.MerchantBalance));
    }

    public async Task<Dictionary<Guid, AcquirerBalanceSnapshot>> GetCurrentAcquirerBalanceSnapshotsAsync(
        IReadOnlyList<Guid>? acquirerIds,
        ApiEnvironment environment,
        CancellationToken ct = default)
    {
        return await GetCurrentAcquirerBalanceCompositionAsync(acquirerIds, environment, ct);
    }

    public async Task<Dictionary<Guid, long>> GetTotalAvailableForWithdrawalByAcquirerAsync(
        IReadOnlyList<Acquirer> acquirers,
        ApiEnvironment environment,
        CancellationToken ct = default)
    {
        var acquirerIds = acquirers.Select(a => a.Id).ToList();
        var acquirerBalances = await GetCurrentAcquirerBalanceSnapshotsAsync(acquirerIds, environment, ct);

        var available = new Dictionary<Guid, long>(acquirers.Count);
        foreach (var acq in acquirers)
        {
            var composition = acquirerBalances.GetValueOrDefault(acq.Id);
            var grossBalance = composition?.GrossBalance ?? 0;
            var merchantAvailableBalance = composition?.MerchantAvailableBalance ?? 0;

            available[acq.Id] = CalculateAvailableForWithdrawal(grossBalance, merchantAvailableBalance);
        }

        return available;
    }

    public long CalculateGrossBalance(long settlementBalance, long payoutsOutBalance)
    {
        return settlementBalance - payoutsOutBalance;
    }

    public long CalculatePlatformProfit(long grossBalance, long merchantBalance)
    {
        return Math.Max(0, grossBalance - merchantBalance);
    }

    public long CalculateSafefyProfit(long swiftpayProfitBase, long completedPlatformPayouts)
    {
        return Math.Max(0, swiftpayProfitBase - completedPlatformPayouts);
    }

    public long CalculateMerchantBalance(long grossBalance, long swiftpayProfit)
    {
        return grossBalance - swiftpayProfit;
    }

    public long CalculateAvailableForWithdrawal(long grossBalance, long merchantAvailableBalance)
    {
        return grossBalance - merchantAvailableBalance;
    }

    public long CalculateMerchantReserveAmount(long netAmount, int reservePercentageBasisPoints)
    {
        if (netAmount <= 0 || reservePercentageBasisPoints <= 0)
            return 0;

        return (long)((decimal)netAmount * reservePercentageBasisPoints / 10000m);
    }

    public long CalculateMerchantSettlementAmount(long netAmount, int reservePercentageBasisPoints)
    {
        if (netAmount <= 0)
            return 0;

        var reserveAmount = CalculateMerchantReserveAmount(netAmount, reservePercentageBasisPoints);
        return Math.Max(0, netAmount - reserveAmount);
    }

    public long CalculateRefundedMerchantSettlementAmount(long merchantSettlementAmount, long originalAmount, long refundedAmount)
    {
        if (merchantSettlementAmount <= 0 || originalAmount <= 0 || refundedAmount <= 0)
            return 0;

        var normalizedRefundedAmount = Math.Min(refundedAmount, originalAmount);
        var refundedSettlementAmount = (long)(merchantSettlementAmount * ((decimal)normalizedRefundedAmount / originalAmount));
        return Math.Min(merchantSettlementAmount, refundedSettlementAmount);
    }

    public async Task<Dictionary<Guid, long>> GetAutoSplitProfitByAcquirerAsync(ApiEnvironment environment, CancellationToken ct = default)
    {
        return await dbContext.Payments
            .AsNoTracking()
            .Where(p => p.Status == PaymentStatus.Completed
                     && p.Environment == environment
                     && p.AcquirerId.HasValue)
            .Join(dbContext.Acquirers,
                  p => p.AcquirerId!.Value,
                  a => a.Id,
                  (p, a) => new { p, a.PixFeeSplitHandling, a.BoletoFeeSplitHandling, a.CreditCardFeeSplitHandling })
            .Where(x =>
                (x.p.Method == PaymentMethod.Pix && x.PixFeeSplitHandling == PaymentFeeSplitHandling.AutoSplitToBank) ||
                (x.p.Method == PaymentMethod.Boleto && x.BoletoFeeSplitHandling == PaymentFeeSplitHandling.AutoSplitToBank) ||
                (x.p.Method == PaymentMethod.CreditCard && x.CreditCardFeeSplitHandling == PaymentFeeSplitHandling.AutoSplitToBank))
            .GroupBy(x => x.p.AcquirerId!.Value)
            .Select(g => new { AcquirerId = g.Key, Profit = g.Sum(x => x.p.PlatformFee - x.p.AcquirerFee) })
            .ToDictionaryAsync(x => x.AcquirerId, x => x.Profit, ct);
    }

    public async Task<Dictionary<Guid, long>> GetPartiallyRefundedRemainingProfitByAcquirerAsync(ApiEnvironment environment, CancellationToken ct = default)
    {
        var payments = await dbContext.Payments
            .AsNoTracking()
            .Where(p => p.Status == PaymentStatus.PartiallyRefunded
                     && p.Environment == environment
                     && p.AcquirerId.HasValue)
            .Select(p => new { p.AcquirerId, p.PlatformFee, p.AcquirerFee, p.Amount, p.RefundedAmount })
            .ToListAsync(ct);

        var result = new Dictionary<Guid, long>();
        foreach (var p in payments)
        {
            var profit = p.PlatformFee - p.AcquirerFee;
            if (profit <= 0) continue;

            var debitAmount = (long)(profit * (decimal)p.RefundedAmount / p.Amount);
            var remaining = profit - debitAmount;

            var acquirerId = p.AcquirerId!.Value;
            result[acquirerId] = result.GetValueOrDefault(acquirerId, 0) + remaining;
        }
        return result;
    }

    public async Task<PlatformExpectedBalances> GetPlatformExpectedBalancesAsync(
        ApiEnvironment environment,
        CancellationToken ct = default)
    {
        var activeAcquirers = await dbContext.Acquirers
            .AsNoTracking()
            .Where(a => a.IsActive && a.SupportsWithdrawal)
            .ToListAsync(ct);
        var availableByAcquirer = await GetTotalAvailableForWithdrawalByAcquirerAsync(activeAcquirers, environment, ct);

        var completedPaymentsData = await dbContext.Payments
            .AsNoTracking()
            .Where(p => p.Status == PaymentStatus.Completed && p.Environment == environment)
            .GroupBy(p => 1)
            .Select(g => new
            {
                TotalPlatformFees = g.Sum(p => p.PlatformFee),
                TotalAcquirerFees = g.Sum(p => p.AcquirerFee),
                Count = g.Count()
            })
            .OrderBy(x => x.Count)
            .FirstOrDefaultAsync(ct);

        var completedPayoutsData = await dbContext.Payouts
            .AsNoTracking()
            .Where(p => p.Status == PayoutStatus.Completed && p.Environment == environment)
            .GroupBy(p => 1)
            .Select(g => new
            {
                TotalPlatformFees = g.Sum(p => p.PlatformFee),
                TotalAcquirerFees = g.Sum(p => p.AcquirerFee),
                Count = g.Count()
            })
            .OrderBy(x => x.Count)
            .FirstOrDefaultAsync(ct);

        var processingPayoutItemsData = await dbContext.PlatformPayoutItems
            .AsNoTracking()
            .Where(i => i.Status == PlatformPayoutItemStatus.Processing
                     && i.PlatformPayout.Environment == environment)
            .GroupBy(i => 1)
            .Select(g => new { TotalAmount = g.Sum(i => i.Amount), Count = g.Count() })
            .OrderBy(x => x.Count)
            .FirstOrDefaultAsync(ct);

        var completedPayoutItemsData = await dbContext.PlatformPayoutItems
            .AsNoTracking()
            .Where(i => i.Status == PlatformPayoutItemStatus.Completed
                     && i.PlatformPayout.Environment == environment)
            .GroupBy(i => 1)
            .Select(g => new
            {
                TotalAmount = g.Sum(i => i.Amount),
                TotalNetAmount = g.Sum(i => i.NetAmount),
                TotalAcquirerFee = g.Sum(i => i.AcquirerFee),
                Count = g.Count()
            })
            .OrderBy(x => x.Count)
            .FirstOrDefaultAsync(ct);

        var partiallyRefundedPayments = await dbContext.Payments
            .AsNoTracking()
            .Where(p => p.Status == PaymentStatus.PartiallyRefunded && p.Environment == environment)
            .Select(p => new { p.PlatformFee, p.AcquirerFee, p.Amount, p.RefundedAmount })
            .ToListAsync(ct);

        var partiallyRefundedRemainingProfit = partiallyRefundedPayments.Sum(p =>
        {
            var profit = p.PlatformFee - p.AcquirerFee;
            if (profit <= 0) return 0L;
            var debitAmount = (long)(profit * (decimal)p.RefundedAmount / p.Amount);
            return profit - debitAmount;
        });

        var autoSplitProfitData = await dbContext.Payments
            .AsNoTracking()
            .Where(p => p.Status == PaymentStatus.Completed
                     && p.Environment == environment
                     && p.AcquirerId.HasValue)
            .Join(dbContext.Acquirers,
                  p => p.AcquirerId!.Value,
                  a => a.Id,
                  (p, a) => new { p, a.PixFeeSplitHandling, a.BoletoFeeSplitHandling, a.CreditCardFeeSplitHandling })
            .Where(x =>
                (x.p.Method == PaymentMethod.Pix && x.PixFeeSplitHandling == PaymentFeeSplitHandling.AutoSplitToBank) ||
                (x.p.Method == PaymentMethod.Boleto && x.BoletoFeeSplitHandling == PaymentFeeSplitHandling.AutoSplitToBank) ||
                (x.p.Method == PaymentMethod.CreditCard && x.CreditCardFeeSplitHandling == PaymentFeeSplitHandling.AutoSplitToBank))
            .GroupBy(x => 1)
            .Select(g => new { TotalProfit = g.Sum(x => x.p.PlatformFee - x.p.AcquirerFee) })
            .OrderBy(x => x.TotalProfit)
            .FirstOrDefaultAsync(ct);

        var totalAutoSplitProfit = autoSplitProfitData?.TotalProfit ?? 0;
        var totalPlatformFeesFromPayments = completedPaymentsData?.TotalPlatformFees ?? 0;
        var totalAcquirerFeesFromPayments = completedPaymentsData?.TotalAcquirerFees ?? 0;
        var totalProfitFeesFromPayments = totalPlatformFeesFromPayments - totalAcquirerFeesFromPayments;
        var totalPlatformFeesFromPayouts = completedPayoutsData?.TotalPlatformFees ?? 0;
        var totalAcquirerFeesFromPayouts = completedPayoutsData?.TotalAcquirerFees ?? 0;
        var totalProfitFeesFromPayouts = totalPlatformFeesFromPayouts - totalAcquirerFeesFromPayouts;
        var totalProcessingPayoutAmount = processingPayoutItemsData?.TotalAmount ?? 0;
        var totalCompletedPayoutAmount = completedPayoutItemsData?.TotalAmount ?? 0;
        var totalCompletedPayoutNetAmount = completedPayoutItemsData?.TotalNetAmount ?? 0;
        var totalAcquirerFeesFromPlatformPayouts = completedPayoutItemsData?.TotalAcquirerFee ?? 0;

        var expectedBlocked = totalProcessingPayoutAmount;
        var expectedPayoutsOut = totalCompletedPayoutNetAmount + totalAutoSplitProfit;

        return new PlatformExpectedBalances
        {
            TotalAvailableForWithdrawal = availableByAcquirer.Values.Sum(),
            ExpectedBlocked = expectedBlocked,
            ExpectedPayoutsOut = expectedPayoutsOut,
            TotalPlatformFeesFromPayments = totalPlatformFeesFromPayments,
            TotalAcquirerFeesFromPayments = totalAcquirerFeesFromPayments,
            TotalProfitFeesFromPayments = totalProfitFeesFromPayments,
            TotalAutoSplitProfit = totalAutoSplitProfit,
            TotalPlatformFeesFromPayouts = totalPlatformFeesFromPayouts,
            TotalAcquirerFeesFromPayouts = totalAcquirerFeesFromPayouts,
            TotalProfitFeesFromPayouts = totalProfitFeesFromPayouts,
            PartiallyRefundedRemainingProfit = partiallyRefundedRemainingProfit,
            TotalProcessingPayoutAmount = totalProcessingPayoutAmount,
            TotalCompletedPayoutAmount = totalCompletedPayoutAmount,
            TotalCompletedPayoutNetAmount = totalCompletedPayoutNetAmount,
            TotalAcquirerFeesFromPlatformPayouts = totalAcquirerFeesFromPlatformPayouts,
            CompletedPaymentsCount = completedPaymentsData?.Count ?? 0,
            CompletedPayoutsCount = completedPayoutsData?.Count ?? 0,
            ProcessingPayoutItemsCount = processingPayoutItemsData?.Count ?? 0,
            CompletedPayoutItemsCount = completedPayoutItemsData?.Count ?? 0
        };
    }

    private async Task<Dictionary<Guid, AcquirerBalanceSnapshot>> GetCurrentAcquirerBalanceCompositionAsync(
        IReadOnlyList<Guid>? acquirerIds,
        ApiEnvironment environment,
        CancellationToken ct)
    {
        var settlementQuery = dbContext.Accounts
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(a => a.Environment == environment
                     && a.AcquirerId.HasValue
                     && a.Type == AccountType.AcquirerSettlement);

        var payoutsOutQuery = dbContext.Accounts
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(a => a.Environment == environment
                     && a.AcquirerId.HasValue
                     && a.Type == AccountType.AcquirerPayoutsOut);

        var merchantBalanceQuery = dbContext.Accounts
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(a => a.Environment == environment
                     && a.MerchantAcquirerId.HasValue
                     && (a.Type == AccountType.MerchantAvailable || a.Type == AccountType.MerchantBlocked || a.Type == AccountType.MerchantReserved)
                     && a.MerchantAcquirer != null);

        var merchantAvailableQuery = dbContext.Accounts
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(a => a.Environment == environment
                     && a.MerchantAcquirerId.HasValue
                     && a.Type == AccountType.MerchantAvailable
                     && a.MerchantAcquirer != null);

        if (acquirerIds is { Count: > 0 })
        {
            settlementQuery = settlementQuery.Where(a => acquirerIds.Contains(a.AcquirerId!.Value));
            payoutsOutQuery = payoutsOutQuery.Where(a => acquirerIds.Contains(a.AcquirerId!.Value));
            merchantBalanceQuery = merchantBalanceQuery.Where(a => acquirerIds.Contains(a.MerchantAcquirer!.AcquirerId));
            merchantAvailableQuery = merchantAvailableQuery.Where(a => acquirerIds.Contains(a.MerchantAcquirer!.AcquirerId));
        }

        var settlementByAcquirer = await settlementQuery
            .GroupBy(a => a.AcquirerId!.Value)
            .Select(g => new { AcquirerId = g.Key, Balance = g.Sum(a => a.Balance) })
            .ToDictionaryAsync(x => x.AcquirerId, x => x.Balance, ct);

        var payoutsOutByAcquirer = await payoutsOutQuery
            .GroupBy(a => a.AcquirerId!.Value)
            .Select(g => new { AcquirerId = g.Key, Balance = g.Sum(a => a.Balance) })
            .ToDictionaryAsync(x => x.AcquirerId, x => x.Balance, ct);

        var merchantBalanceByAcquirer = await merchantBalanceQuery
            .GroupBy(a => a.MerchantAcquirer!.AcquirerId)
            .Select(g => new { AcquirerId = g.Key, Balance = g.Sum(a => a.Balance) })
            .ToDictionaryAsync(x => x.AcquirerId, x => x.Balance, ct);

        var merchantAvailableByAcquirer = await merchantAvailableQuery
            .GroupBy(a => a.MerchantAcquirer!.AcquirerId)
            .Select(g => new { AcquirerId = g.Key, Balance = g.Sum(a => a.Balance) })
            .ToDictionaryAsync(x => x.AcquirerId, x => x.Balance, ct);

        var allAcquirerIds = settlementByAcquirer.Keys
            .Union(payoutsOutByAcquirer.Keys)
            .Union(merchantBalanceByAcquirer.Keys)
            .Union(merchantAvailableByAcquirer.Keys)
            .Union(acquirerIds ?? []);

        return allAcquirerIds.ToDictionary(
            id => id,
            id => new AcquirerBalanceSnapshot
            {
                SettlementBalance = settlementByAcquirer.GetValueOrDefault(id, 0),
                PayoutsOutBalance = payoutsOutByAcquirer.GetValueOrDefault(id, 0),
                GrossBalance = CalculateGrossBalance(
                    settlementByAcquirer.GetValueOrDefault(id, 0),
                    payoutsOutByAcquirer.GetValueOrDefault(id, 0)),
                MerchantBalance = merchantBalanceByAcquirer.GetValueOrDefault(id, 0),
                MerchantAvailableBalance = merchantAvailableByAcquirer.GetValueOrDefault(id, 0)
            });
    }

    public List<PlatformPayoutDistributionItem> BuildSmartPayoutDistribution(
        long totalAmount,
        IReadOnlyList<Acquirer> acquirers,
        IReadOnlyDictionary<Guid, long> availableByAcquirer)
    {
        var sortedAcquirers = acquirers
            .Where(a => availableByAcquirer.GetValueOrDefault(a.Id, 0) > 0)
            .OrderByDescending(a => availableByAcquirer.GetValueOrDefault(a.Id, 0));

        var items = new List<PlatformPayoutDistributionItem>();
        var remaining = totalAmount;

        foreach (var acq in sortedAcquirers)
        {
            if (remaining <= 0) break;

            var available = availableByAcquirer.GetValueOrDefault(acq.Id, 0);
            if (available <= 0) continue;

            var amount = Math.Min(remaining, available);
            var fee = FeeCalculator.Calculate(amount, acq.PayoutFeeMode, acq.PayoutFeeFixed, acq.PayoutFeePercentage);
            var net = amount - fee;

            if (!IsValidSmartPayoutCandidate(acq, amount, fee, net))
                continue;

            items.Add(new PlatformPayoutDistributionItem(acq, amount, fee, net));
            remaining -= amount;
        }

        return items;
    }

    private static bool IsValidSmartPayoutCandidate(Acquirer acquirer, long amount, long fee, long net)
    {
        if (amount <= 0 || net <= 0)
            return false;

        var amountToSend = FeeCalculator.CalculatePayoutAmountToSend(net, fee, acquirer.PayoutFeeHandling);

        if (amountToSend <= 0)
            return false;

        if (amountToSend < acquirer.MinPayoutAmount)
            return false;

        if (acquirer.MaxPayoutAmount > 0 && amountToSend > acquirer.MaxPayoutAmount)
            return false;

        return true;
    }

    public List<PlatformPayoutDistributionItem> BuildManualPayoutDistribution(
        IReadOnlyList<PayoutDistributionRequest> requestItems,
        IReadOnlyList<Acquirer> acquirers,
        IReadOnlyDictionary<Guid, long> availableByAcquirer)
    {
        var acquirerMap = acquirers.ToDictionary(a => a.Id);
        var items = new List<PlatformPayoutDistributionItem>();

        foreach (var reqItem in requestItems)
        {
            if (!acquirerMap.TryGetValue(reqItem.AcquirerId, out var acq)) continue;

            var available = availableByAcquirer.GetValueOrDefault(acq.Id, 0);
            if (available <= 0) continue;

            var amount = Math.Min(reqItem.Amount, available);
            if (amount <= 0) continue;

            var fee = FeeCalculator.Calculate(amount, acq.PayoutFeeMode, acq.PayoutFeeFixed, acq.PayoutFeePercentage);
            var net = amount - fee;

            if (!IsValidSmartPayoutCandidate(acq, amount, fee, net))
                continue;

            items.Add(new PlatformPayoutDistributionItem(acq, amount, fee, net));
        }

        return items;
    }

    public long CalculateEstimatedReferralCommission(long eligibleProfit, int referralCommissionBasisPoints)
    {
        if (eligibleProfit <= 0 || referralCommissionBasisPoints <= 0)
            return 0;

        return FeeCalculator.CalculateReferralCommission(eligibleProfit, referralCommissionBasisPoints);
    }

    public (long FromPayments, long FromPayouts, long Total) CalculateEstimatedReferralCommissionTotal(
        long eligibleProfitFromPayments,
        long eligibleProfitFromPayouts,
        int referralCommissionBasisPoints)
    {
        var fromPayments = CalculateEstimatedReferralCommission(eligibleProfitFromPayments, referralCommissionBasisPoints);
        var fromPayouts = CalculateEstimatedReferralCommission(eligibleProfitFromPayouts, referralCommissionBasisPoints);

        return (fromPayments, fromPayouts, fromPayments + fromPayouts);
    }

    public (long FromPayments, long FromPayouts, long Total) CalculateEstimatedReferralCommissionTotalFromMovements(
        IReadOnlyCollection<long> paymentProfits,
        IReadOnlyCollection<long> payoutProfits,
        int referralCommissionBasisPoints)
    {
        if (referralCommissionBasisPoints <= 0)
            return (0, 0, 0);

        var fromPayments = paymentProfits
            .Where(x => x > 0)
            .Sum(x => CalculateEstimatedReferralCommission(x, referralCommissionBasisPoints));

        var fromPayouts = payoutProfits
            .Where(x => x > 0)
            .Sum(x => CalculateEstimatedReferralCommission(x, referralCommissionBasisPoints));

        return (fromPayments, fromPayouts, fromPayments + fromPayouts);
    }
}
