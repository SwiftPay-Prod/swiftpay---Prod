using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.EndpointsGroups;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Admin.Revenue.ReadPlatformRevenue;

public sealed class ReadPlatformRevenueEndpoint(
    PrimaryDbContext dbContext,
    ILedgerService ledgerService,
    ICalculationService calculationService,
    IEnvironmentProvider environmentProvider
) : Endpoint<ReadPlatformRevenueRequest, ReadPlatformRevenueResponse>
{
    private const int DefaultMaxAcquirers = 4;

    public override void Configure()
    {
        Get("revenue");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ReadPlatformRevenueRequest req, CancellationToken ct)
    {
        var maxAcquirers = req.MaxAcquirers ?? DefaultMaxAcquirers;
        var environment = environmentProvider.CurrentEnvironment;

        var acquirers = await dbContext.Acquirers
            .AsNoTracking()
            .Where(a => a.IsActive)
            .ToListAsync(ct);

        var availableByAcquirer = await calculationService.GetTotalAvailableForWithdrawalByAcquirerAsync(acquirers, environment, ct);

        var acquirerSettlementByAcquirer = await dbContext.Accounts
            .AsNoTracking()
            .Where(a => a.Type == AccountType.AcquirerSettlement && a.AcquirerId.HasValue)
            .GroupBy(a => a.AcquirerId!.Value)
            .Select(g => new { AcquirerId = g.Key, TotalIn = g.Sum(a => a.Balance) })
            .ToListAsync(ct);

        var completedPaymentsByAcquirer = await dbContext.Payments
            .AsNoTracking()
            .Where(p => p.Status == PaymentStatus.Completed && p.AcquirerId.HasValue)
            .GroupBy(p => p.AcquirerId!.Value)
            .Select(g => new { AcquirerId = g.Key, Transactions = g.Count() })
            .ToListAsync(ct);

        var completedPayoutsByAcquirer = await dbContext.Payouts
            .AsNoTracking()
            .Where(p => p.Status == PayoutStatus.Completed)
            .Include(p => p.MerchantAcquirer)
            .GroupBy(p => p.MerchantAcquirer!.AcquirerId)
            .Select(g => new { AcquirerId = g.Key, Transactions = g.Count() })
            .ToListAsync(ct);

        var settlementByAcquirer = acquirerSettlementByAcquirer
            .ToDictionary(x => x.AcquirerId, x => x.TotalIn);
        var paymentTransactionsByAcquirer = completedPaymentsByAcquirer
            .ToDictionary(x => x.AcquirerId, x => x.Transactions);
        var payoutTransactionsByAcquirer = completedPayoutsByAcquirer
            .ToDictionary(x => x.AcquirerId, x => x.Transactions);

        var platformBalanceInfo = await ledgerService.GetPlatformBalanceInfoAsync();
        var totalAvailableForWithdrawal = platformBalanceInfo.Available;

        var allAcquirerRevenues = acquirers
            .Select(a =>
            {
                var totalIn = settlementByAcquirer.GetValueOrDefault(a.Id, 0);
            var available = availableByAcquirer.GetValueOrDefault(a.Id, 0);
                var paymentTransactions = paymentTransactionsByAcquirer.GetValueOrDefault(a.Id, 0);
                var payoutTransactions = payoutTransactionsByAcquirer.GetValueOrDefault(a.Id, 0);

                return new AdminAcquirerRevenueData
                {
                    AcquirerId = a.Id,
                    AcquirerName = a.DisplayName ?? a.Name,
                    AcquirerCode = a.Code,
                    AcquirerLogoUrl = a.LogoUrl,
                    OperationTypes = a.OperationTypes.Select(t => t.ToString()).ToList(),
                    Volume = totalIn,
                    Fees = 0,
                    Transactions = paymentTransactions,
                    PayoutVolume = 0,
                    PayoutFees = 0,
                    PayoutTransactions = payoutTransactions,
                    Settlement = available
                };
            })
            .ToList();

        var totalVolume = allAcquirerRevenues.Sum(a => a.Volume);
        var totalFees = allAcquirerRevenues.Sum(a => a.Fees);
        var totalTransactions = allAcquirerRevenues.Sum(a => a.Transactions);
        var totalPayoutVolume = allAcquirerRevenues.Sum(a => a.PayoutVolume);
        var totalPayoutFees = allAcquirerRevenues.Sum(a => a.PayoutFees);
        var totalPayoutTransactions = allAcquirerRevenues.Sum(a => a.PayoutTransactions);
        var totalRevenue = totalAvailableForWithdrawal;

        var topAcquirers = allAcquirerRevenues
            .OrderByDescending(a => a.Settlement)
            .ThenByDescending(a => a.Volume)
            .Take(maxAcquirers)
            .ToList();

        await Send.OkAsync(new ReadPlatformRevenueResponse
        {
            Data = new AdminPlatformRevenueData
            {
                TotalAvailableForWithdrawal = totalAvailableForWithdrawal,
                TotalVolume = totalVolume,
                TotalFees = totalFees,
                TotalTransactions = totalTransactions,
                TotalPayoutVolume = totalPayoutVolume,
                TotalPayoutFees = totalPayoutFees,
                TotalPayoutTransactions = totalPayoutTransactions,
                TotalRevenue = totalRevenue,
                TotalAcquirers = allAcquirerRevenues.Count,
                AcquirerRevenues = topAcquirers
            }
        }, ct);
    }
}
