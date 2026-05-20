using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_core.Models.Messages;
using safefy_api_core.Services;
using safefy_api_core.Utils;

namespace safefy_api_core.Consumers;

public class ReconcilePlatformBalanceConsumer : IConsumer<ReconcilePlatformBalanceMessage>
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly INotificationService _notificationService;
    private readonly ILogger<ReconcilePlatformBalanceConsumer> _logger;

    public ReconcilePlatformBalanceConsumer(
        IServiceScopeFactory scopeFactory,
        INotificationService notificationService,
        ILogger<ReconcilePlatformBalanceConsumer> logger)
    {
        _scopeFactory = scopeFactory;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<ReconcilePlatformBalanceMessage> context)
    {
        var message = context.Message;

        try
        {
            using var environmentScope = HybridEnvironmentProvider.SetEnvironment(message.Environment);
            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();
            var calculationService = scope.ServiceProvider.GetRequiredService<ICalculationService>();
            var ledgerRepository = scope.ServiceProvider.GetRequiredService<ILedgerRepository>();

            // ===== RECONCILIAÇÃO DA PLATAFORMA =====
            var platformAccounts = await dbContext.Accounts
                .IgnoreQueryFilters()
                .Where(a => a.MerchantId == null
                         && a.AcquirerId == null
                         && a.Environment == message.Environment
                         && (a.Type == AccountType.PlatformBlocked
                             || a.Type == AccountType.PlatformPayoutsOut))
                .ToListAsync();

            var currentBlocked = platformAccounts.FirstOrDefault(a => a.Type == AccountType.PlatformBlocked)?.Balance ?? 0;
            var currentPayoutsOut = platformAccounts.FirstOrDefault(a => a.Type == AccountType.PlatformPayoutsOut)?.Balance ?? 0;

            // Calcular valores esperados via serviço centralizado
            var expected = await calculationService.GetPlatformExpectedBalancesAsync(message.Environment);
            var expectedBlocked = expected.ExpectedBlocked;
            var expectedPayoutsOut = expected.ExpectedPayoutsOut;
            var completedPaymentsCount = expected.CompletedPaymentsCount;
            var processingPayoutItemsCount = expected.ProcessingPayoutItemsCount;
            var completedPayoutItemsCount = expected.CompletedPayoutItemsCount;

            var blockedDifference = currentBlocked - expectedBlocked;
            var payoutsOutDifference = currentPayoutsOut - expectedPayoutsOut;

            var hasPlatformDiscrepancy = Math.Abs(blockedDifference) > 0
                                      || Math.Abs(payoutsOutDifference) > 0;
            var totalAvailableForWithdrawal = expected.TotalAvailableForWithdrawal;

            // ===== RECONCILIAÇÃO DAS ADQUIRENTES =====
            var acquirerDiscrepancies = await ReconcileAcquirerAccountsAsync(
                dbContext,
                calculationService,
                ledgerRepository,
                message.Environment,
                message.ApplyFix);

            var hasAcquirerDiscrepancy = acquirerDiscrepancies.Any(d => d.HasDiscrepancy);
            var hasDiscrepancy = hasPlatformDiscrepancy || hasAcquirerDiscrepancy;
            var wasFixed = false;

            if (message.ApplyFix && hasPlatformDiscrepancy)
            {
                var blockedAccount = platformAccounts.FirstOrDefault(a => a.Type == AccountType.PlatformBlocked)
                    ?? await ledgerRepository.GetOrCreatePlatformBlockedAccountAsync(message.Environment);
                var payoutsOutAccount = platformAccounts.FirstOrDefault(a => a.Type == AccountType.PlatformPayoutsOut)
                    ?? await ledgerRepository.GetOrCreatePlatformPayoutsOutAccountAsync(message.Environment);

                await ApplyReconciliationAccountDeltaAsync(
                    ledgerRepository,
                    blockedAccount,
                    expectedBlocked - currentBlocked,
                    LedgerTransactionOperation.Reversal,
                    $"Reconciliação da plataforma ({message.Environment}) - PlatformBlocked");

                await ApplyReconciliationAccountDeltaAsync(
                    ledgerRepository,
                    payoutsOutAccount,
                    expectedPayoutsOut - currentPayoutsOut,
                    LedgerTransactionOperation.Reversal,
                    $"Reconciliação da plataforma ({message.Environment}) - PlatformPayoutsOut");

                wasFixed = true;
            }

            var title = hasDiscrepancy
                ? (wasFixed || (message.ApplyFix && hasAcquirerDiscrepancy) ? "Reconciliação concluida" : "Discrepancia encontrada")
                : "Reconciliação concluida";

            var notificationMessage = BuildNotificationMessage(
                hasPlatformDiscrepancy,
                hasAcquirerDiscrepancy,
                wasFixed || (message.ApplyFix && hasAcquirerDiscrepancy),
                totalAvailableForWithdrawal,
                blockedDifference,
                payoutsOutDifference,
                acquirerDiscrepancies,
                completedPaymentsCount,
                processingPayoutItemsCount,
                completedPayoutItemsCount);

            var notificationType = hasDiscrepancy && !message.ApplyFix
                ? NotificationType.Warning
                : NotificationType.Success;

            await _notificationService.CreateUserNotificationAsync(
                message.RequestedByUserId,
                notificationType,
                title,
                notificationMessage,
                NotificationPriority.Normal,
                "/panel/admin/balances");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Error processing platform balance reconciliation: RequestedBy={UserId}",
                message.RequestedByUserId);

            // Notificar erro
            await _notificationService.CreateUserNotificationAsync(
                message.RequestedByUserId,
                NotificationType.Error,
                "Reconciliação falhou",
                "Falha ao reconciliar saldos da plataforma.",
                NotificationPriority.High);

            throw;
        }
    }

    private static string BuildNotificationMessage(
        bool hasPlatformDiscrepancy,
        bool hasAcquirerDiscrepancy,
        bool wasFixed,
        long totalAvailableForWithdrawal,
        long blockedDifference,
        long payoutsOutDifference,
        List<AcquirerDiscrepancy> acquirerDiscrepancies,
        int paymentsCount,
        int processingCount,
        int completedCount)
    {
        if (!hasPlatformDiscrepancy && !hasAcquirerDiscrepancy)
        {
            return $"Sem discrepancias. Disponivel para saque: {FormatUtils.FormatCurrency(totalAvailableForWithdrawal)}. Pagamentos: {paymentsCount}, saques proc: {processingCount}, saques concl: {completedCount}.";
        }

        var parts = new List<string>();

        // Platform discrepancies
        if (hasPlatformDiscrepancy)
        {
            var platformParts = new List<string>();

            if (blockedDifference != 0)
            {
                var formattedDiff = FormatUtils.FormatCurrency(Math.Abs(blockedDifference));
                platformParts.Add($"Bloq {(blockedDifference > 0 ? "+" : "-")}{formattedDiff}");
            }

            if (payoutsOutDifference != 0)
            {
                var formattedDiff = FormatUtils.FormatCurrency(Math.Abs(payoutsOutDifference));
                platformParts.Add($"Sac {(payoutsOutDifference > 0 ? "+" : "-")}{formattedDiff}");
            }

            if (platformParts.Count > 0)
                parts.Add($"Plataforma: {string.Join(", ", platformParts)}");
        }

        // Acquirer discrepancies
        foreach (var acq in acquirerDiscrepancies.Where(a => a.HasDiscrepancy))
        {
            var acqParts = new List<string>();

            if (acq.SettlementDifference != 0)
            {
                var formattedDiff = FormatUtils.FormatCurrency(Math.Abs(acq.SettlementDifference));
                acqParts.Add($"Ent {(acq.SettlementDifference > 0 ? "+" : "-")}{formattedDiff}");
            }

            if (acq.PayoutsOutDifference != 0)
            {
                var formattedDiff = FormatUtils.FormatCurrency(Math.Abs(acq.PayoutsOutDifference));
                acqParts.Add($"Sai {(acq.PayoutsOutDifference > 0 ? "+" : "-")}{formattedDiff}");
            }

            if (acq.MerchantBalanceDifference != 0)
            {
                var formattedDiff = FormatUtils.FormatCurrency(Math.Abs(acq.MerchantBalanceDifference));
                acqParts.Add($"Org {(acq.MerchantBalanceDifference > 0 ? "+" : "-")}{formattedDiff}");
            }

            if (acq.SafefyProfitDifference != 0)
            {
                var formattedDiff = FormatUtils.FormatCurrency(Math.Abs(acq.SafefyProfitDifference));
                acqParts.Add($"Lucro {(acq.SafefyProfitDifference > 0 ? "+" : "-")}{formattedDiff}");
            }

            if (acqParts.Count > 0)
                parts.Add($"{acq.AcquirerName}: {string.Join(", ", acqParts)}");
        }

        if (wasFixed)
        {
            return $"Discrepancias corrigidas: {string.Join("; ", parts)}. Disponivel para saque: {FormatUtils.FormatCurrency(totalAvailableForWithdrawal)}.";
        }

        return $"Discrepancias: {string.Join("; ", parts)}. Disponivel para saque: {FormatUtils.FormatCurrency(totalAvailableForWithdrawal)}.";
    }

    private async Task<List<AcquirerDiscrepancy>> ReconcileAcquirerAccountsAsync(
        PrimaryDbContext dbContext,
        ICalculationService calculationService,
        ILedgerRepository ledgerRepository,
        ApiEnvironment environment,
        bool applyFix)
    {
        var discrepancies = new List<AcquirerDiscrepancy>();

        // Match the preview endpoint and reconcile every acquirer present in the environment,
        // including disabled ones that may still hold balances or historical discrepancies.
        var acquirers = await dbContext.Acquirers
            .IgnoreQueryFilters()
            .Select(a => new { a.Id, a.Name })
            .ToListAsync();

        var currentSnapshotsByAcquirer = await calculationService.GetCurrentAcquirerBalanceSnapshotsAsync(
            acquirers.Select(a => a.Id).ToList(),
            environment);

        foreach (var acquirer in acquirers)
        {
            var currentSnapshot = currentSnapshotsByAcquirer.GetValueOrDefault(acquirer.Id);

            // Get current balances from accounts by type and acquirerId
            var settlementAccount = await dbContext.Accounts
                .IgnoreQueryFilters()
                .OrderBy(a => a.Id)
                .FirstOrDefaultAsync(a => a.AcquirerId == acquirer.Id
                                       && a.Type == AccountType.AcquirerSettlement
                                       && a.Environment == environment);

            var payoutsOutAccount = await dbContext.Accounts
                .IgnoreQueryFilters()
                .OrderBy(a => a.Id)
                .FirstOrDefaultAsync(a => a.AcquirerId == acquirer.Id
                                       && a.Type == AccountType.AcquirerPayoutsOut
                                       && a.Environment == environment);

            var currentSettlement = currentSnapshot?.SettlementBalance ?? settlementAccount?.Balance ?? 0;
            var currentPayoutsOut = currentSnapshot?.PayoutsOutBalance ?? payoutsOutAccount?.Balance ?? 0;

            // Calculate expected AcquirerSettlement:
            // + (Amount - AcquirerFee) from Completed payments
            // - (Amount - AcquirerFee) from Refunded/PartiallyRefunded payments
            var completedSettlement = await dbContext.Payments
                .IgnoreQueryFilters()
                .Where(p => p.AcquirerId == acquirer.Id
                         && p.Environment == environment
                         && p.Status == PaymentStatus.Completed)
                .SumAsync(p => p.AcquirerNetAmount);

            var refundedSettlement = await dbContext.Payments
                .IgnoreQueryFilters()
                .Where(p => p.AcquirerId == acquirer.Id
                         && p.Environment == environment
                         && (p.Status == PaymentStatus.Refunded || p.Status == PaymentStatus.PartiallyRefunded))
                .Select(p => p.Status == PaymentStatus.Refunded
                    ? p.AcquirerNetAmount
                    : (long)(p.AcquirerNetAmount * ((decimal)p.RefundedAmount / p.Amount)))
                .SumAsync();

            var expectedSettlement = completedSettlement - refundedSettlement;

            if (settlementAccount != null)
            {
                var settlementAdjustmentEntries = await dbContext.LedgerTransactions
                    .IgnoreQueryFilters()
                    .Where(lt => lt.Operation == LedgerTransactionOperation.AcquirerAdjustment
                              || lt.Operation == LedgerTransactionOperation.AcquirerSafefyProfitAdjustment)
                    .SelectMany(lt => lt.LedgerEntries)
                    .Where(e => e.AccountId == settlementAccount.Id)
                    .GroupBy(e => e.Type)
                    .Select(g => new { Type = g.Key, Total = g.Sum(e => e.Amount) })
                    .ToListAsync();

                var settlementAdjustmentNet = settlementAdjustmentEntries
                    .Sum(x => x.Type == LedgerEntryType.Credit ? x.Total : -x.Total);

                expectedSettlement += settlementAdjustmentNet;
            }

            // Calculate expected AcquirerPayoutsOut:
            // + (NetAmount + AcquirerFee) from Completed merchant payouts
            // Payout.MerchantAcquirerId -> MerchantAcquirer.AcquirerId == acquirer.Id
            var merchantPayoutsOut = await dbContext.Payouts
                .IgnoreQueryFilters()
                .Join(dbContext.MerchantAcquirers.IgnoreQueryFilters(),
                      payout => payout.MerchantAcquirerId,
                      ma => ma.Id,
                      (payout, ma) => new { payout, ma.AcquirerId })
                .Where(x => x.AcquirerId == acquirer.Id
                         && x.payout.Status == PayoutStatus.Completed
                         && x.payout.Environment == environment)
                .SumAsync(x => x.payout.NetAmount + x.payout.AcquirerFee);

            // + Amount from Completed platform payouts
            // PlatformPayoutItem.AcquirerId == acquirer.Id
            // Filter by PlatformPayout.Environment
            var platformPayoutsOut = await dbContext.PlatformPayoutItems
                .IgnoreQueryFilters()
                .Join(dbContext.PlatformPayouts.IgnoreQueryFilters(),
                      item => item.PlatformPayoutId,
                      payout => payout.Id,
                      (item, payout) => new { item, payout.Environment })
                .Where(x => x.item.AcquirerId == acquirer.Id
                         && x.item.Status == PlatformPayoutItemStatus.Completed
                         && x.Environment == environment)
                .SumAsync(x => x.item.Amount);

            var expectedPayoutsOut = merchantPayoutsOut + platformPayoutsOut;

            var currentGrossBalance = calculationService.CalculateGrossBalance(currentSettlement, currentPayoutsOut);
            var expectedGrossBalance = calculationService.CalculateGrossBalance(expectedSettlement, expectedPayoutsOut);

            var currentMerchantBalance = currentSnapshot?.MerchantBalance ?? 0;
            var currentSafefyProfit = calculationService.CalculatePlatformProfit(currentGrossBalance, currentMerchantBalance);

            var completedPaymentProfit = await dbContext.Payments
                .IgnoreQueryFilters()
                .Where(p => p.AcquirerId == acquirer.Id
                         && p.Environment == environment
                         && p.Status == PaymentStatus.Completed)
                .SumAsync(p => p.PlatformFee - p.AcquirerFee);

            var refundedPaymentProfit = await dbContext.Payments
                .IgnoreQueryFilters()
                .Where(p => p.AcquirerId == acquirer.Id
                         && p.Environment == environment
                         && (p.Status == PaymentStatus.Refunded || p.Status == PaymentStatus.PartiallyRefunded))
                .SumAsync(p => p.PlatformFee - p.AcquirerFee);

            var payoutProfit = await dbContext.Payouts
                .IgnoreQueryFilters()
                .Join(dbContext.MerchantAcquirers.IgnoreQueryFilters(),
                      payout => payout.MerchantAcquirerId,
                      merchantAcquirer => merchantAcquirer.Id,
                      (payout, merchantAcquirer) => new { payout, merchantAcquirer.AcquirerId })
                .Where(x => x.AcquirerId == acquirer.Id
                         && x.payout.Environment == environment
                         && x.payout.Status == PayoutStatus.Completed)
                .SumAsync(x => x.payout.PlatformFee - x.payout.AcquirerFee);

            var safefyProfitAdjustmentEntries = settlementAccount == null
                ? []
                : await dbContext.LedgerTransactions
                    .IgnoreQueryFilters()
                    .Where(lt => lt.Operation == LedgerTransactionOperation.AcquirerSafefyProfitAdjustment)
                    .SelectMany(lt => lt.LedgerEntries)
                    .Where(e => e.AccountId == settlementAccount.Id)
                    .GroupBy(e => e.Type)
                    .Select(g => new { Type = g.Key, Total = g.Sum(e => e.Amount) })
                    .ToListAsync();

            var safefyProfitAdjustmentNet = safefyProfitAdjustmentEntries
                .Sum(x => x.Type == LedgerEntryType.Credit ? x.Total : -x.Total);

            var expectedPaymentProfit = completedPaymentProfit - refundedPaymentProfit;
            var expectedSafefyProfitBase = expectedPaymentProfit + payoutProfit + safefyProfitAdjustmentNet;
            var expectedSafefyProfit = calculationService.CalculateSafefyProfit(expectedSafefyProfitBase, platformPayoutsOut);
            var expectedMerchantBalance = calculationService.CalculateMerchantBalance(expectedGrossBalance, expectedSafefyProfit);

            var settlementDifference = currentSettlement - expectedSettlement;
            var payoutsOutDifference = currentPayoutsOut - expectedPayoutsOut;
            var grossBalanceDifference = currentGrossBalance - expectedGrossBalance;
            var merchantBalanceDifference = currentMerchantBalance - expectedMerchantBalance;
            var safefyProfitDifference = currentSafefyProfit - expectedSafefyProfit;
            var hasDiscrepancy = Math.Abs(settlementDifference) > 0
                              || Math.Abs(payoutsOutDifference) > 0
                              || Math.Abs(grossBalanceDifference) > 0
                              || Math.Abs(merchantBalanceDifference) > 0
                              || Math.Abs(safefyProfitDifference) > 0;

            if (applyFix && hasDiscrepancy)
            {
                settlementAccount ??= await ledgerRepository.GetOrCreateAcquirerSettlementAccountAsync(acquirer.Id, environment);
                payoutsOutAccount ??= await ledgerRepository.GetOrCreateAcquirerPayoutsOutAccountAsync(acquirer.Id, environment);

                await ApplyReconciliationAccountDeltaAsync(
                    ledgerRepository,
                    settlementAccount,
                    expectedSettlement - currentSettlement,
                    LedgerTransactionOperation.Reversal,
                    $"Reconciliação da adquirente {acquirer.Name} ({environment}) - AcquirerSettlement");

                await ApplyReconciliationAccountDeltaAsync(
                    ledgerRepository,
                    payoutsOutAccount,
                    expectedPayoutsOut - currentPayoutsOut,
                    LedgerTransactionOperation.Reversal,
                    $"Reconciliação da adquirente {acquirer.Name} ({environment}) - AcquirerPayoutsOut");

                await ApplyReconciliationAccountDeltaAsync(
                    ledgerRepository,
                    settlementAccount,
                    merchantBalanceDifference,
                    LedgerTransactionOperation.AcquirerAdjustment,
                    $"Reconciliação da adquirente {acquirer.Name} ({environment}) - MerchantBalance");
            }

            discrepancies.Add(new AcquirerDiscrepancy
            {
                AcquirerId = acquirer.Id,
                AcquirerName = acquirer.Name,
                CurrentSettlement = currentSettlement,
                ExpectedSettlement = expectedSettlement,
                SettlementDifference = settlementDifference,
                CurrentPayoutsOut = currentPayoutsOut,
                ExpectedPayoutsOut = expectedPayoutsOut,
                PayoutsOutDifference = payoutsOutDifference,
                MerchantBalanceDifference = merchantBalanceDifference,
                SafefyProfitDifference = safefyProfitDifference,
                HasDiscrepancy = hasDiscrepancy
            });
        }

        return discrepancies;
    }

    private static async Task ApplyReconciliationAccountDeltaAsync(
        ILedgerRepository ledgerRepository,
        Account account,
        long delta,
        LedgerTransactionOperation operation,
        string note)
    {
        if (delta == 0)
        {
            return;
        }

        var now = DateTime.UtcNow;
        var amount = Math.Abs(delta);

        await ledgerRepository.CreateTransactionWithAtomicBalanceUpdateAsync(
            operation,
            amount,
            [new LedgerEntry
            {
                AccountId = account.Id,
                Type = delta > 0 ? LedgerEntryType.Credit : LedgerEntryType.Debit,
                Amount = amount,
                Timestamp = now,
                Description = note
            }],
            [(account.Id, delta)],
            notes: note,
            status: LedgerTransactionStatus.Approved);
    }

    private sealed class AcquirerDiscrepancy
    {
        public Guid AcquirerId { get; init; }
        public string AcquirerName { get; init; } = string.Empty;
        public long CurrentSettlement { get; init; }
        public long ExpectedSettlement { get; init; }
        public long SettlementDifference { get; init; }
        public long CurrentPayoutsOut { get; init; }
        public long ExpectedPayoutsOut { get; init; }
        public long PayoutsOutDifference { get; init; }
        public long MerchantBalanceDifference { get; init; }
        public long SafefyProfitDifference { get; init; }
        public bool HasDiscrepancy { get; init; }
    }
}
