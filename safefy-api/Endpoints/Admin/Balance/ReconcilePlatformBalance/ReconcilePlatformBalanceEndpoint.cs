using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Constants;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_core.Models.Messages;
using safefy_api_core.Utils;
using safefy_api.EndpointsGroups;

namespace safefy_api.Endpoints.Admin.Balance.ReconcilePlatformBalance;

public sealed class ReconcilePlatformBalanceEndpoint(
    PrimaryDbContext dbContext,
    IEnvironmentProvider environmentProvider,
    IMessagePublisher messagePublisher,
    ICalculationService calculationService
) : Endpoint<ReconcilePlatformBalanceRequest, ReconcilePlatformBalanceResponse>
{
    public override void Configure()
    {
        Post("/balance/reconcile");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ReconcilePlatformBalanceRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReconcilePlatformBalanceResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var environment = environmentProvider.CurrentEnvironment;

        // Se applyFix=true, envia para fila e retorna 202
        if (req.ApplyFix)
        {
            await messagePublisher.PublishAsync(
                RabbitMQQueues.ReconcilePlatformBalance,
                new ReconcilePlatformBalanceMessage
                {
                    RequestedByUserId = userId.Value,
                    ApplyFix = true,
                    Environment = environment
                });

            await Send.ResponseAsync(new ReconcilePlatformBalanceResponse
            {
                Message = "Correção de saldos iniciada. Você será notificado quando o processo for concluído."
            }, 202, ct);
            return;
        }

        // Caso contrário, retorna preview síncrono

        // 1. Buscar saldos atuais das contas da plataforma
        var accounts = await dbContext.Accounts
            .IgnoreQueryFilters()
            .Where(a => a.MerchantId == null
                     && a.AcquirerId == null
                     && a.Environment == environment
                     && (a.Type == AccountType.PlatformBlocked
                         || a.Type == AccountType.PlatformPayoutsOut))
            .ToListAsync(ct);

        var currentBlocked = accounts.FirstOrDefault(a => a.Type == AccountType.PlatformBlocked)?.Balance ?? 0;
        var currentPayoutsOut = accounts.FirstOrDefault(a => a.Type == AccountType.PlatformPayoutsOut)?.Balance ?? 0;

        // 2. Calcular valores esperados via serviço centralizado
        var expected = await calculationService.GetPlatformExpectedBalancesAsync(environment, ct);

        var expectedBlocked = expected.ExpectedBlocked;
        var expectedPayoutsOut = expected.ExpectedPayoutsOut;

        // 4. Calcular diferenças
        var blockedDifference = currentBlocked - expectedBlocked;
        var payoutsOutDifference = currentPayoutsOut - expectedPayoutsOut;

        var allAcquirers = await dbContext.Acquirers
            .AsNoTracking()
            .Select(a => new Acquirer
            {
                Id = a.Id,
                Name = a.Name,
                Code = a.Code,
                DisplayName = a.DisplayName,
                LogoUrl = a.LogoUrl,
                PayoutFeeMode = a.PayoutFeeMode,
                PayoutFeeFixed = a.PayoutFeeFixed,
                PayoutFeePercentage = a.PayoutFeePercentage,
                IsActive = a.IsActive,
                SupportsWithdrawal = a.SupportsWithdrawal
            })
            .ToListAsync(ct);

        var allAcquirerIds = allAcquirers.Select(a => a.Id).ToList();

        var currentSnapshotsByAcquirer = await calculationService.GetCurrentAcquirerBalanceSnapshotsAsync(
            allAcquirerIds,
            environment,
            ct);

        // 5. Reconciliação das adquirentes
        var acquirerReconciliations = await CalculateAcquirerReconciliationsAsync(allAcquirerIds, ct);

        var currentAvailableForWithdrawal = currentSnapshotsByAcquirer.Values.Sum(snapshot =>
            calculationService.CalculateAvailableForWithdrawal(
                snapshot.GrossBalance,
                snapshot.MerchantAvailableBalance));

        var expectedAvailableByAcquirer = await calculationService.GetTotalAvailableForWithdrawalByAcquirerAsync(
            allAcquirers,
            environment,
            ct);
        var expectedAvailableForWithdrawal = expectedAvailableByAcquirer.Values.Sum();

        var availableForWithdrawalDifference = currentAvailableForWithdrawal - expectedAvailableForWithdrawal;
        var platformMismatchAmount = Math.Abs(availableForWithdrawalDifference)
                                   + Math.Abs(blockedDifference)
                                   + Math.Abs(payoutsOutDifference);
        var criticalAcquirersCount = acquirerReconciliations.Count(a => a.OverdrawAmount > 0);
        var discrepantAcquirersCount = acquirerReconciliations.Count(a => a.HasDiscrepancy);
        var criticalOverdrawAmount = acquirerReconciliations
            .Where(a => a.OverdrawAmount > 0)
            .Sum(a => a.OverdrawAmount);

        var hasPlatformDiscrepancy = Math.Abs(availableForWithdrawalDifference) > 0
                          || Math.Abs(blockedDifference) > 0
                          || Math.Abs(payoutsOutDifference) > 0;

        var hasAcquirerDiscrepancy = acquirerReconciliations.Any(a => a.HasDiscrepancy);
        var hasDiscrepancy = hasPlatformDiscrepancy || hasAcquirerDiscrepancy;

        await Send.OkAsync(new ReconcilePlatformBalanceResponse
        {
            Data = new PlatformReconciliationData
            {
                HasDiscrepancy = hasDiscrepancy,
                WasFixed = false,
                Summary = new PlatformReconciliationSummary
                {
                    PlatformMismatchAmount = platformMismatchAmount,
                    CriticalAcquirersCount = criticalAcquirersCount,
                    DiscrepantAcquirersCount = discrepantAcquirersCount,
                    CriticalOverdrawAmount = criticalOverdrawAmount
                },
                TotalAvailableForWithdrawal = new PlatformReconciliationAccount
                {
                    Expected = expectedAvailableForWithdrawal,
                    Current = currentAvailableForWithdrawal,
                    Difference = availableForWithdrawalDifference
                },
                Blocked = new PlatformReconciliationAccount
                {
                    Expected = expectedBlocked,
                    Current = currentBlocked,
                    Difference = blockedDifference
                },
                PayoutsOut = new PlatformReconciliationAccount
                {
                    Expected = expectedPayoutsOut,
                    Current = currentPayoutsOut,
                    Difference = payoutsOutDifference
                },
                Details = new ReconciliationDetails
                {
                    TotalAvailableForWithdrawal = expectedAvailableForWithdrawal,
                    TotalPlatformFeesFromPayments = expected.TotalPlatformFeesFromPayments,
                    TotalAcquirerFeesFromPayments = expected.TotalAcquirerFeesFromPayments,
                    TotalProfitFeesFromPayments = expected.TotalProfitFeesFromPayments,
                    TotalPlatformFeesFromPayouts = expected.TotalPlatformFeesFromPayouts,
                    TotalAcquirerFeesFromPayouts = expected.TotalAcquirerFeesFromPayouts,
                    TotalProfitFeesFromPayouts = expected.TotalProfitFeesFromPayouts,
                    TotalAcquirerFeesFromPlatformPayouts = expected.TotalAcquirerFeesFromPlatformPayouts,
                    TotalProcessingPayoutAmount = expected.TotalProcessingPayoutAmount,
                    TotalCompletedPayoutNetAmount = expected.TotalCompletedPayoutNetAmount,
                    TotalCompletedPayoutAmount = expected.TotalCompletedPayoutAmount,
                    TotalAutoSplitProfit = expected.TotalAutoSplitProfit,
                    PartiallyRefundedRemainingProfit = expected.PartiallyRefundedRemainingProfit,
                    CompletedPaymentsCount = expected.CompletedPaymentsCount,
                    CompletedPayoutsCount = expected.CompletedPayoutsCount,
                    ProcessingPayoutItemsCount = expected.ProcessingPayoutItemsCount,
                    CompletedPayoutItemsCount = expected.CompletedPayoutItemsCount
                },
                Acquirers = acquirerReconciliations
            }
        }, ct);
    }

    private async Task<List<AcquirerReconciliationData>> CalculateAcquirerReconciliationsAsync(
        IReadOnlyCollection<Guid> operationalAcquirerIds,
        CancellationToken ct)
    {
        var acquirerReconciliations = new List<AcquirerReconciliationData>();

        var merchantAvailableByAcquirer = await dbContext.Accounts
            .Where(a => a.MerchantId.HasValue
                     && a.MerchantAcquirerId.HasValue
                     && a.Type == AccountType.MerchantAvailable)
            .Join(dbContext.MerchantAcquirers,
                  account => account.MerchantAcquirerId,
                  merchantAcquirer => merchantAcquirer.Id,
                  (account, merchantAcquirer) => new { merchantAcquirer.AcquirerId, account.Balance })
            .GroupBy(x => x.AcquirerId)
            .Select(g => new { AcquirerId = g.Key, Total = g.Sum(x => x.Balance) })
            .ToDictionaryAsync(x => x.AcquirerId, x => x.Total, ct);

        var merchantBalancesByAcquirer = await dbContext.Accounts
            .Where(a => a.MerchantId.HasValue
                     && a.MerchantAcquirerId.HasValue
                     && (a.Type == AccountType.MerchantAvailable || a.Type == AccountType.MerchantBlocked || a.Type == AccountType.MerchantReserved))
            .Join(dbContext.MerchantAcquirers,
                  account => account.MerchantAcquirerId,
                  merchantAcquirer => merchantAcquirer.Id,
                  (account, merchantAcquirer) => new { merchantAcquirer.AcquirerId, account.Balance })
            .GroupBy(x => x.AcquirerId)
            .Select(g => new { AcquirerId = g.Key, Total = g.Sum(x => x.Balance) })
            .ToDictionaryAsync(x => x.AcquirerId, x => x.Total, ct);

        var acquirers = await dbContext.Acquirers
            .Where(a => operationalAcquirerIds.Contains(a.Id))
            .Select(a => new { a.Id, a.Name, a.DisplayName, a.Code, a.LogoUrl })
            .ToListAsync(ct);

        foreach (var acquirer in acquirers)
        {
            var settlementAccount = await dbContext.Accounts
                .OrderBy(a => a.Id)
                .FirstOrDefaultAsync(a => a.AcquirerId == acquirer.Id
                                       && a.Type == AccountType.AcquirerSettlement, ct);

            var payoutsOutAccount = await dbContext.Accounts
                .OrderBy(a => a.Id)
                .FirstOrDefaultAsync(a => a.AcquirerId == acquirer.Id
                                       && a.Type == AccountType.AcquirerPayoutsOut, ct);

            var currentSettlement = settlementAccount?.Balance ?? 0;
            var currentPayoutsOut = payoutsOutAccount?.Balance ?? 0;

            var paymentData = await dbContext.Payments
                .Where(p => p.AcquirerId == acquirer.Id)
                .GroupBy(p => p.Status)
                .Select(g => new
                {
                    Status = g.Key,
                    TotalAmount = g.Sum(p => p.Amount),
                    TotalAcquirerFee = g.Sum(p => p.AcquirerFee),
                    TotalAcquirerNetAmount = g.Sum(p => p.Amount - p.AcquirerFee)
                })
                .ToListAsync(ct);

            // Volume bruto (Amount) - deve bater com Volume Total do dashboard
            var grossVolume = paymentData
                .Where(d => d.Status == PaymentStatus.Completed)
                .Sum(d => d.TotalAmount);

            // Total de taxas das adquirentes
            var totalAcquirerFees = paymentData
                .Where(d => d.Status == PaymentStatus.Completed)
                .Sum(d => d.TotalAcquirerFee);

            var completedSettlement = paymentData
                .Where(d => d.Status == PaymentStatus.Completed)
                .Sum(d => d.TotalAcquirerNetAmount);

            var refundedSettlement = paymentData
                .Where(d => d.Status == PaymentStatus.Refunded || d.Status == PaymentStatus.PartiallyRefunded)
                .Sum(d => d.TotalAcquirerNetAmount);

            var expectedSettlement = completedSettlement - refundedSettlement;

            if (settlementAccount != null)
            {
                var settlementAdjustmentEntries = await dbContext.LedgerTransactions
                    .Where(lt => lt.Operation == LedgerTransactionOperation.AcquirerAdjustment
                              || lt.Operation == LedgerTransactionOperation.AcquirerSafefyProfitAdjustment)
                    .SelectMany(lt => lt.LedgerEntries)
                    .Where(e => e.AccountId == settlementAccount.Id)
                    .GroupBy(e => e.Type)
                    .Select(g => new { Type = g.Key, Total = g.Sum(e => e.Amount) })
                    .ToListAsync(ct);

                var settlementAdjustmentNet = settlementAdjustmentEntries
                    .Sum(x => x.Type == LedgerEntryType.Credit ? x.Total : -x.Total);

                expectedSettlement += settlementAdjustmentNet;
            }

            var merchantPayoutsOut = await dbContext.Payouts
                .Join(dbContext.MerchantAcquirers,
                      payout => payout.MerchantAcquirerId,
                      ma => ma.Id,
                      (payout, ma) => new { payout, ma.AcquirerId })
                .Where(x => x.AcquirerId == acquirer.Id
                         && x.payout.Status == PayoutStatus.Completed)
                .SumAsync(x => x.payout.NetAmount + x.payout.AcquirerFee, ct);

            var platformPayoutsOut = await dbContext.PlatformPayoutItems
                .Where(i => i.AcquirerId == acquirer.Id
                         && i.Status == PlatformPayoutItemStatus.Completed)
                .SumAsync(i => i.Amount, ct);

            var expectedPayoutsOut = merchantPayoutsOut + platformPayoutsOut;

            var currentGrossBalance = currentSettlement - currentPayoutsOut;
            var expectedGrossBalance = expectedSettlement - expectedPayoutsOut;

            var currentMerchantBalance = merchantBalancesByAcquirer.GetValueOrDefault(acquirer.Id, 0);
            var currentMerchantAvailable = merchantAvailableByAcquirer.GetValueOrDefault(acquirer.Id, 0);
            var currentSafefyProfit = calculationService.CalculateAvailableForWithdrawal(currentGrossBalance, currentMerchantAvailable);

            var expectedSafefyProfit = calculationService.CalculateAvailableForWithdrawal(expectedGrossBalance, currentMerchantAvailable);
            var expectedMerchantBalance = expectedGrossBalance - expectedSafefyProfit;

            var settlementDifference = currentSettlement - expectedSettlement;
            var payoutsOutDifference = currentPayoutsOut - expectedPayoutsOut;
            var grossBalanceDifference = currentGrossBalance - expectedGrossBalance;
            var merchantBalanceDifference = currentMerchantBalance - expectedMerchantBalance;
            var safefyProfitDifference = currentSafefyProfit - expectedSafefyProfit;
            var overdrawAmount = Math.Max(currentPayoutsOut - currentSettlement, 0);
            var totalMismatch = Math.Abs(settlementDifference)
                              + Math.Abs(payoutsOutDifference)
                              + Math.Abs(grossBalanceDifference)
                              + Math.Abs(merchantBalanceDifference)
                              + Math.Abs(safefyProfitDifference);

            var hasDiscrepancy = Math.Abs(settlementDifference) > 0
                                 || Math.Abs(payoutsOutDifference) > 0
                                 || Math.Abs(grossBalanceDifference) > 0
                                 || Math.Abs(merchantBalanceDifference) > 0
                                 || Math.Abs(safefyProfitDifference) > 0;

            var inReconciliation = new PlatformReconciliationAccount
            {
                Expected = expectedSettlement,
                Current = currentSettlement,
                Difference = settlementDifference
            };

            var outReconciliation = new PlatformReconciliationAccount
            {
                Expected = expectedPayoutsOut,
                Current = currentPayoutsOut,
                Difference = payoutsOutDifference
            };

            acquirerReconciliations.Add(new AcquirerReconciliationData
            {
                AcquirerId = acquirer.Id,
                AcquirerName = acquirer.Name,
                AcquirerDisplayName = acquirer.DisplayName,
                AcquirerCode = acquirer.Code,
                AcquirerLogoUrl = acquirer.LogoUrl,
                HasDiscrepancy = hasDiscrepancy,
                GrossVolume = grossVolume,
                TotalAcquirerFees = totalAcquirerFees,
                In = inReconciliation,
                Out = outReconciliation,
                GrossBalance = new PlatformReconciliationAccount
                {
                    Expected = expectedGrossBalance,
                    Current = currentGrossBalance,
                    Difference = grossBalanceDifference
                },
                MerchantBalance = new PlatformReconciliationAccount
                {
                    Expected = expectedMerchantBalance,
                    Current = currentMerchantBalance,
                    Difference = merchantBalanceDifference
                },
                SafefyProfit = new PlatformReconciliationAccount
                {
                    Expected = expectedSafefyProfit,
                    Current = currentSafefyProfit,
                    Difference = safefyProfitDifference
                },
                OverdrawAmount = overdrawAmount,
                TotalMismatch = totalMismatch,
                Settlement = inReconciliation,
                PayoutsOut = outReconciliation
            });
        }

        return acquirerReconciliations;
    }
}
