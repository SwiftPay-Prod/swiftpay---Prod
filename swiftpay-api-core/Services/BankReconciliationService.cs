using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Models.Messages;
using swiftpay_api_core.Constants;
using swiftpay_api_core.Utils;

namespace swiftpay_api_core.Services;

public class BankReconciliationService : IBankReconciliationService
{
    private readonly PrimaryDbContext _dbContext;
    private readonly ILedgerRepository _ledgerRepository;
    private readonly IMessagePublisher _messagePublisher;
    private readonly INotificationService _notificationService;
    private readonly IEnvironmentProvider _environmentProvider;
    private readonly ILogger<BankReconciliationService> _logger;
    private static readonly AccountType[] TrackedAccountTypes =
    [
        AccountType.MerchantAvailable,
        AccountType.MerchantPending,
        AccountType.MerchantBlocked,
        AccountType.MerchantPayoutsOut
    ];

    public BankReconciliationService(
        PrimaryDbContext dbContext,
        ILedgerRepository ledgerRepository,
        IMessagePublisher messagePublisher,
        INotificationService notificationService,
        IEnvironmentProvider environmentProvider,
        ILogger<BankReconciliationService> logger)
    {
        _dbContext = dbContext;
        _ledgerRepository = ledgerRepository;
        _messagePublisher = messagePublisher;
        _notificationService = notificationService;
        _environmentProvider = environmentProvider;
        _logger = logger;
    }

    public async Task<BankReconciliation> StartReconciliationAsync(
        Guid merchantId,
        Guid requestedByUserId,
        bool silentMode = false,
        Guid? batchId = null)
    {
        var ct = CancellationToken.None;
        var environment = _environmentProvider.CurrentEnvironment;

        var merchant = await _dbContext.Merchants
            .FirstOrDefaultAsync(m => m.Id == merchantId, ct)
            ?? throw new InvalidOperationException("Merchant not found");

        var pendingReconciliation = await _dbContext.BankReconciliations
            .FirstOrDefaultAsync(br =>
                br.MerchantId == merchantId &&
                br.Environment == environment &&
                (br.Status == BankReconciliationStatus.Pending || br.Status == BankReconciliationStatus.Processing), ct);

        if (pendingReconciliation != null)
        {
            throw new InvalidOperationException("There is already a pending reconciliation for this merchant and environment");
        }

        var reconciliation = new BankReconciliation
        {
            Id = Guid.CreateVersion7(),
            MerchantId = merchantId,
            Environment = environment,
            Status = BankReconciliationStatus.Pending,
            SilentMode = silentMode,
            RequestedByUserId = requestedByUserId,
            BatchId = batchId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _dbContext.BankReconciliations.Add(reconciliation);
        await _dbContext.SaveChangesAsync(ct);

        await _messagePublisher.PublishAsync(
            RabbitMQQueues.ProcessBankReconciliation,
            new ProcessBankReconciliationMessage
            {
                ReconciliationId = reconciliation.Id,
                MerchantId = merchantId,
                Environment = environment,
                RequestedByUserId = requestedByUserId
            });

        return reconciliation;
    }

    public async Task<ReconciliationResult> ProcessReconciliationAsync(Guid reconciliationId)
    {
        var ct = CancellationToken.None;
        var reconciliation = await _dbContext.BankReconciliations
            .Include(br => br.Merchant)
            .FirstOrDefaultAsync(br => br.Id == reconciliationId, ct);

        if (reconciliation == null)
        {
            return new ReconciliationResult { Success = false, ErrorMessage = "Reconciliation not found" };
        }

        if (reconciliation.Status != BankReconciliationStatus.Pending)
        {
            return new ReconciliationResult
            {
                Success = false,
                ErrorMessage = "Reconciliation is not in pending status",
                Reconciliation = reconciliation
            };
        }

        try
        {
            reconciliation.Status = BankReconciliationStatus.Processing;
            reconciliation.ProcessingStartedAt = DateTime.UtcNow;
            reconciliation.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(ct);

            await ProcessReconciliationInternal(reconciliation, ct);

            reconciliation.Status = reconciliation.HasDiscrepancies
                ? BankReconciliationStatus.CompletedWithDiscrepancies
                : BankReconciliationStatus.Completed;
            reconciliation.ProcessingCompletedAt = DateTime.UtcNow;
            reconciliation.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(ct);

            if (reconciliation.BatchId.HasValue)
            {
                await CheckAndNotifyBatchCompletionAsync(reconciliation, ct);
            }
            else
            {
                var notificationMessage = reconciliation.HasDiscrepancies
                    ? $"Concluida com {reconciliation.TotalDiscrepancies} divergencias."
                    : "Concluida sem divergencias.";

                await _notificationService.CreateUserNotificationAsync(
                    reconciliation.RequestedByUserId,
                    reconciliation.HasDiscrepancies ? NotificationType.Warning : NotificationType.Success,
                    "Reconciliação bancaria concluida",
                    notificationMessage,
                    actionUrl: $"/panel/admin/merchants/{reconciliation.MerchantId}");
            }

            return new ReconciliationResult { Success = true, Reconciliation = reconciliation };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing reconciliation: ReconciliationId={ReconciliationId}", reconciliationId);

            reconciliation.Status = BankReconciliationStatus.Failed;
            reconciliation.ErrorMessage = ex.Message;
            reconciliation.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(ct);

            if (reconciliation.BatchId.HasValue)
            {
                await CheckAndNotifyBatchCompletionAsync(reconciliation, ct);
            }
            else
            {
                await _notificationService.CreateUserNotificationAsync(
                    reconciliation.RequestedByUserId,
                    NotificationType.Error,
                    "Reconciliação bancaria falhou",
                    "Falha ao reconciliar banco. Tente novamente.");
            }

            return new ReconciliationResult { Success = false, ErrorMessage = ex.Message, Reconciliation = reconciliation };
        }
    }

    private async Task CheckAndNotifyBatchCompletionAsync(BankReconciliation reconciliation, CancellationToken ct)
    {
        var hasRemainingItems = await _dbContext.BankReconciliations
            .IgnoreQueryFilters()
            .AnyAsync(br =>
                br.BatchId == reconciliation.BatchId &&
                (br.Status == BankReconciliationStatus.Pending ||
                 br.Status == BankReconciliationStatus.Processing), ct);

        if (hasRemainingItems) return;

        var batchItems = await _dbContext.BankReconciliations
            .IgnoreQueryFilters()
            .Where(br => br.BatchId == reconciliation.BatchId)
            .ToListAsync(ct);

        var total = batchItems.Count;
        var failed = batchItems.Count(x => x.Status == BankReconciliationStatus.Failed);
        var withDiscrepancies = batchItems.Count(x => x.Status == BankReconciliationStatus.CompletedWithDiscrepancies);
        var completed = batchItems.Count(x =>
            x.Status == BankReconciliationStatus.Completed ||
            x.Status == BankReconciliationStatus.CompletedWithDiscrepancies);

        var notificationType = failed > 0 || withDiscrepancies > 0 ? NotificationType.Warning : NotificationType.Success;
        var summary = $"{completed} de {total} concluída(s)";
        if (withDiscrepancies > 0) summary += $", {withDiscrepancies} com divergências";
        if (failed > 0) summary += $", {failed} com erro";
        summary += ".";

        await _notificationService.CreateUserNotificationAsync(
            reconciliation.RequestedByUserId,
            notificationType,
            "Reconciliação em lote concluída",
            summary,
            actionUrl: "/panel/admin/reconciliations");
    }

    private async Task ProcessReconciliationInternal(BankReconciliation reconciliation, CancellationToken ct)
    {
        var computation = await ComputeReconciliationAsync(reconciliation, ct);

        reconciliation.LedgerBalance = computation.CurrentBalances.GetValueOrDefault(AccountType.MerchantAvailable);
        reconciliation.CalculatedBalance = computation.ExpectedBalances.GetValueOrDefault(AccountType.MerchantAvailable);
        reconciliation.BalanceDifference = reconciliation.LedgerBalance - reconciliation.CalculatedBalance;

        reconciliation.TotalPaymentsAmount = computation.TotalPaymentsAmount;
        reconciliation.TotalPaymentsCount = computation.TotalPaymentsCount;
        reconciliation.TotalFeesAmount = computation.TotalFeesAmount;
        reconciliation.TotalPayoutsAmount = computation.TotalPayoutsAmount;
        reconciliation.TotalPayoutsCount = computation.TotalPayoutsCount;
        reconciliation.TotalRefundsAmount = computation.TotalRefundsAmount;
        reconciliation.TotalRefundsCount = computation.TotalRefundsCount;
        reconciliation.TotalAdjustmentsAmount = computation.TotalAdjustmentsAmount;
        reconciliation.TotalAdjustmentsCount = computation.TotalAdjustmentsCount;
        reconciliation.TotalLedgerTransactionsCount = computation.TotalLedgerTransactionsCount;

        reconciliation.TotalDiscrepancies = computation.Discrepancies.Count;
        reconciliation.DiscrepanciesCount = computation.Discrepancies.Count;
        reconciliation.DiscrepanciesTotalAmount = computation.Discrepancies.Sum(d => Math.Abs(d.Difference));
        reconciliation.DiscrepanciesWithErrorAmount = computation.Discrepancies
            .Where(d => d.Severity >= ReconciliationDiscrepancySeverity.Error)
            .Sum(d => Math.Abs(d.Difference));
        reconciliation.HasDiscrepancies = computation.Discrepancies.Count > 0;

        if (computation.Discrepancies.Count > 0)
        {
            _dbContext.BankReconciliationDiscrepancies.AddRange(computation.Discrepancies);
        }
    }

    public async Task<BankReconciliation?> GetReconciliationAsync(Guid reconciliationId)
    {
        var ct = CancellationToken.None;
        return await _dbContext.BankReconciliations
            .Include(br => br.Merchant)
            .Include(br => br.RequestedByUser)
            .Include(br => br.CorrectionsAppliedByUser)
            .Include(br => br.Discrepancies.OrderByDescending(d => d.Severity).ThenByDescending(d => Math.Abs(d.Difference)))
            .AsSplitQuery()
            .FirstOrDefaultAsync(br => br.Id == reconciliationId, ct);
    }

    public async Task<List<BankReconciliation>> ListReconciliationsAsync(
        Guid merchantId,
        int page = 1,
        int pageSize = 10)
    {
        var ct = CancellationToken.None;

        return await _dbContext.BankReconciliations
            .Include(br => br.RequestedByUser)
            .Where(br => br.MerchantId == merchantId)
            .OrderByDescending(br => br.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);
    }

    public async Task<int> CountReconciliationsAsync(Guid merchantId)
    {
        var ct = CancellationToken.None;

        return await _dbContext.BankReconciliations
            .Where(br => br.MerchantId == merchantId)
            .CountAsync(ct);
    }

    public async Task<ReconciliationResult> ApplyCorrectionsAsync(
        Guid reconciliationId,
        Guid appliedByUserId,
        string? notes)
    {
        var ct = CancellationToken.None;
        var reconciliation = await _dbContext.BankReconciliations
            .Include(br => br.Discrepancies)
            .FirstOrDefaultAsync(br => br.Id == reconciliationId, ct);

        if (reconciliation == null)
        {
            return new ReconciliationResult { Success = false, ErrorMessage = "Reconciliation not found" };
        }

        if (reconciliation.Status != BankReconciliationStatus.Completed &&
            reconciliation.Status != BankReconciliationStatus.CompletedWithDiscrepancies)
        {
            return new ReconciliationResult
            {
                Success = false,
                ErrorMessage = "Reconciliation is not completed",
                Reconciliation = reconciliation
            };
        }

        if (reconciliation.CorrectionsApplied)
        {
            return new ReconciliationResult
            {
                Success = false,
                ErrorMessage = "Corrections have already been applied",
                Reconciliation = reconciliation
            };
        }

        var computation = await ComputeReconciliationAsync(reconciliation, ct);
        var hasErrorsToCorrect = computation.Discrepancies.Any(d => d.Severity >= ReconciliationDiscrepancySeverity.Error);

        if (!hasErrorsToCorrect)
        {
            return new ReconciliationResult
            {
                Success = false,
                ErrorMessage = "No discrepancies to correct",
                Reconciliation = reconciliation
            };
        }

        var originalDifference = reconciliation.BalanceDifference;
        var bucketIds = computation.ExpectedBalancesByBucket.Keys
            .Concat(computation.CurrentBalancesByBucket.Keys)
            .Distinct()
            .ToList();

        var trackedAccountsByBucket = await GetOrCreateTrackedMerchantAccountsByBucketAsync(
            reconciliation.MerchantId,
            reconciliation.Environment,
            bucketIds,
            ct);

        if (_dbContext.ChangeTracker.HasChanges())
        {
            await _dbContext.SaveChangesAsync(ct);
        }

        var adjustmentSummary = await ApplyLedgerAdjustments(reconciliation, computation, trackedAccountsByBucket, DateTime.UtcNow);

        var now = DateTime.UtcNow;
        foreach (var discrepancy in reconciliation.Discrepancies.Where(d => d.Severity >= ReconciliationDiscrepancySeverity.Error && !d.Corrected))
        {
            if (discrepancy.Type == ReconciliationDiscrepancyType.NegativeAvailableBalance
                || discrepancy.Type == ReconciliationDiscrepancyType.WithdrawalExceedsInflow)
            {
                continue;
            }

            discrepancy.Corrected = true;
            discrepancy.CorrectedAt = now;
            discrepancy.CorrectionDescription = "Ajuste atômico registrado no ledger para alinhar o saldo calculado pela reconciliação.";
        }

        var unresolvedDiscrepancies = reconciliation.Discrepancies
            .Where(d => d.Severity >= ReconciliationDiscrepancySeverity.Error && !d.Corrected)
            .ToList();

        reconciliation.LedgerBalance = computation.ExpectedBalances.GetValueOrDefault(AccountType.MerchantAvailable);
        reconciliation.CalculatedBalance = computation.ExpectedBalances.GetValueOrDefault(AccountType.MerchantAvailable);
        reconciliation.BalanceDifference = 0;
        reconciliation.DiscrepanciesWithErrorAmount = unresolvedDiscrepancies.Sum(d => Math.Abs(d.Difference));
        reconciliation.HasDiscrepancies = unresolvedDiscrepancies.Count > 0;
        reconciliation.TotalAdjustmentsCount += adjustmentSummary.Count;
        reconciliation.TotalAdjustmentsAmount += adjustmentSummary.Amount;
        reconciliation.TotalLedgerTransactionsCount += adjustmentSummary.Count;

        reconciliation.CorrectionsApplied = true;
        reconciliation.CorrectionsAppliedAt = DateTime.UtcNow;
        reconciliation.CorrectionsAppliedByUserId = appliedByUserId;
        reconciliation.CorrectionNotes = notes;
        reconciliation.Status = unresolvedDiscrepancies.Count > 0
            ? BankReconciliationStatus.CompletedWithDiscrepancies
            : BankReconciliationStatus.CorrectionsApplied;
        reconciliation.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(ct);

        // Notificar o merchant (organização) sobre a reconciliação concluída
        var balanceChangeText = originalDifference > 0
            ? $"+{FormatUtils.FormatCurrency(originalDifference)}"
            : FormatUtils.FormatCurrency(originalDifference);

        var merchantNotificationMessage = originalDifference != 0
            ? $"Uma verificação de saldo foi realizada na sua conta. Ajuste aplicado: {balanceChangeText}. Seu saldo foi atualizado automaticamente."
            : "Uma verificação de saldo foi realizada na sua conta. Nenhuma correção foi necessária.";

        await _notificationService.CreateAsync(
            reconciliation.MerchantId,
            originalDifference != 0 ? NotificationType.Info : NotificationType.Success,
            "Verificação de Saldo Concluída",
            merchantNotificationMessage,
            actionUrl: "/panel/merchant/balance-history",
            actionLabel: "Ver Detalhes");

        if (unresolvedDiscrepancies.Count > 0)
        {
            await _notificationService.CreateUserNotificationAsync(
                reconciliation.RequestedByUserId,
                NotificationType.Warning,
                "Reconciliação com divergências remanescentes",
                $"Foram aplicadas correções parciais, mas {unresolvedDiscrepancies.Count} divergência(s) crítica(s) exigem análise manual.",
                actionUrl: $"/panel/admin/reconciliations/{reconciliation.Id}");

            return new ReconciliationResult
            {
                Success = false,
                ErrorMessage = "Correções parciais aplicadas, porém ainda existem divergências críticas não corrigíveis automaticamente.",
                Reconciliation = reconciliation
            };
        }

        return new ReconciliationResult { Success = true, Reconciliation = reconciliation };
    }

    private async Task<ReconciliationComputation> ComputeReconciliationAsync(BankReconciliation reconciliation, CancellationToken ct)
    {
        var merchantId = reconciliation.MerchantId;

        var accounts = await _dbContext.Accounts
            .Where(a => a.MerchantId == merchantId)
            .ToListAsync(ct);

        var accountMetaById = accounts.ToDictionary(a => a.Id, a => new AccountMeta(a.Type, NormalizeBucketKey(a.MerchantAcquirerId)));
        var currentBalances = BuildZeroBalances();
        var currentBalancesByBucket = new Dictionary<Guid, Dictionary<AccountType, long>>();
        foreach (var account in accounts.Where(a => TrackedAccountTypes.Contains(a.Type)))
        {
            currentBalances[account.Type] += account.Balance;

            var bucketKey = NormalizeBucketKey(account.MerchantAcquirerId);

            if (!currentBalancesByBucket.TryGetValue(bucketKey, out var bucketBalances))
            {
                bucketBalances = BuildZeroBalances();
                currentBalancesByBucket[bucketKey] = bucketBalances;
            }

            bucketBalances[account.Type] += account.Balance;
        }

        var payments = await _dbContext.Payments
            .Where(p => p.MerchantId == merchantId)
            .ToListAsync(ct);

        var payouts = await _dbContext.Payouts
            .Where(p => p.MerchantId == merchantId)
            .ToListAsync(ct);

        var paymentIds = payments.Select(p => p.Id).ToHashSet();
        var payoutIds = payouts.Select(p => p.Id).ToHashSet();

        var ledgerTransactions = await _dbContext.LedgerTransactions
            .Where(lt =>
                (lt.PaymentId.HasValue && paymentIds.Contains(lt.PaymentId.Value)) ||
                (lt.PayoutId.HasValue && payoutIds.Contains(lt.PayoutId.Value)))
            .Include(lt => lt.LedgerEntries)
            .ToListAsync(ct);

        var paymentImpacts = ledgerTransactions
            .Where(lt => lt.PaymentId.HasValue)
            .GroupBy(lt => lt.PaymentId!.Value)
            .ToDictionary(g => g.Key, g => SumLedgerImpactByBucket(g.SelectMany(t => t.LedgerEntries), accountMetaById));

        var payoutImpacts = ledgerTransactions
            .Where(lt => lt.PayoutId.HasValue)
            .GroupBy(lt => lt.PayoutId!.Value)
            .ToDictionary(g => g.Key, g => SumLedgerImpactByBucket(g.SelectMany(t => t.LedgerEntries), accountMetaById));

        var expectedBalances = BuildZeroBalances();
        var expectedBalancesByBucket = new Dictionary<Guid, Dictionary<AccountType, long>>();
        var discrepancies = new List<BankReconciliationDiscrepancy>();
        var paymentDeltas = new List<ReconciliationDelta>();
        var payoutDeltas = new List<ReconciliationDelta>();

        long totalPaymentsAmount = 0;
        int totalPaymentsCount = 0;
        long totalFeesAmount = 0;
        long totalRefundsAmount = 0;
        int totalRefundsCount = 0;
        long totalPayoutsAmount = 0;
        int totalPayoutsCount = 0;
        long totalNetInflowToAvailable = 0;
        long totalPayoutDebitsFromAvailable = 0;

        foreach (var payment in payments)
        {
            var expectedImpact = BuildZeroBalances();
            var refundNetAmount = CalculateRefundNetAmount(payment);

            switch (payment.Status)
            {
                case PaymentStatus.Pending:
                case PaymentStatus.Processing:
                    expectedImpact[AccountType.MerchantPending] += payment.NetAmount;
                    break;

                case PaymentStatus.Completed:
                    expectedImpact[AccountType.MerchantAvailable] += payment.NetAmount;
                    totalNetInflowToAvailable += payment.NetAmount;
                    totalPaymentsAmount += payment.Amount;
                    totalPaymentsCount++;
                    totalFeesAmount += payment.PlatformFee + payment.CheckoutTemplateFee;
                    break;

                case PaymentStatus.Refunded:
                case PaymentStatus.PartiallyRefunded:
                    var paymentNetAfterRefund = payment.NetAmount - refundNetAmount;
                    expectedImpact[AccountType.MerchantAvailable] += paymentNetAfterRefund;
                    totalNetInflowToAvailable += paymentNetAfterRefund;
                    totalPaymentsAmount += payment.Amount;
                    totalPaymentsCount++;
                    totalFeesAmount += payment.PlatformFee + payment.CheckoutTemplateFee;
                    if (refundNetAmount > 0)
                    {
                        totalRefundsAmount += refundNetAmount;
                        totalRefundsCount++;
                    }
                    break;
            }

            AddToBalances(expectedBalances, expectedImpact);

            var paymentBucketKey = NormalizeBucketKey(payment.MerchantAcquirerId);

            if (!expectedBalancesByBucket.TryGetValue(paymentBucketKey, out var expectedBucketBalances))
            {
                expectedBucketBalances = BuildZeroBalances();
                expectedBalancesByBucket[paymentBucketKey] = expectedBucketBalances;
            }

            AddToBalances(expectedBucketBalances, expectedImpact);

            var expectedImpactByBucket = new Dictionary<Guid, Dictionary<AccountType, long>>
            {
                [paymentBucketKey] = expectedImpact
            };

            var actualImpactByBucket = paymentImpacts.GetValueOrDefault(payment.Id, []);
            var deltaByBucket = BuildDeltaByBucket(expectedImpactByBucket, actualImpactByBucket);

            foreach (var (bucketId, bucketDelta) in deltaByBucket)
            {
                if (!HasAnyExpectedImpact(bucketDelta))
                {
                    continue;
                }

                paymentDeltas.Add(new ReconciliationDelta
                {
                    MerchantAcquirerId = bucketId,
                    Delta = bucketDelta,
                    PaymentId = payment.Id
                });
            }

            var actualImpact = actualImpactByBucket.TryGetValue(paymentBucketKey, out var actualExpectedBucket)
                ? actualExpectedBucket
                : BuildZeroBalances();

            if (HasAnyExpectedImpact(expectedImpact) && !HasAnyExpectedImpact(actualImpact))
            {
                discrepancies.Add(CreateDiscrepancy(
                    reconciliation.Id,
                    ReconciliationDiscrepancyType.PaymentNotInLedger,
                    ReconciliationDiscrepancySeverity.Error,
                    $"Pagamento {payment.Id} sem impacto no ledger para as contas do merchant.",
                    expectedImpact.Values.Sum(),
                    0,
                    expectedImpact.Values.Sum(),
                    paymentId: payment.Id,
                    suggestedAction: "Reprocessar transações deste pagamento no ledger."));
            }

            foreach (var accountType in TrackedAccountTypes)
            {
                var expected = expectedImpact[accountType];
                var actual = actualImpact[accountType];
                if (expected == actual)
                {
                    continue;
                }

                discrepancies.Add(CreateDiscrepancy(
                    reconciliation.Id,
                    ReconciliationDiscrepancyType.AmountMismatch,
                    ReconciliationDiscrepancySeverity.Error,
                    $"Pagamento {payment.Id} com impacto divergente em {accountType}.",
                    expected,
                    actual,
                    expected - actual,
                    paymentId: payment.Id,
                    suggestedAction: "Ajustar saldo via correção automática da reconciliação."));
            }

            if (refundNetAmount > 0 && actualImpact[AccountType.MerchantAvailable] > expectedImpact[AccountType.MerchantAvailable])
            {
                discrepancies.Add(CreateDiscrepancy(
                    reconciliation.Id,
                    ReconciliationDiscrepancyType.RefundNotInLedger,
                    ReconciliationDiscrepancySeverity.Error,
                    $"Estorno do pagamento {payment.Id} sem impacto completo no saldo disponível.",
                    -refundNetAmount,
                    actualImpact[AccountType.MerchantAvailable] - payment.NetAmount,
                    expectedImpact[AccountType.MerchantAvailable] - actualImpact[AccountType.MerchantAvailable],
                    paymentId: payment.Id,
                    suggestedAction: "Reprocessar estorno deste pagamento no ledger."));
            }
        }

        foreach (var payout in payouts)
        {
            var expectedImpact = BuildZeroBalances();

            switch (payout.Status)
            {
                case PayoutStatus.Pending:
                case PayoutStatus.Processing:
                case PayoutStatus.Confirming:
                    expectedImpact[AccountType.MerchantAvailable] -= payout.Amount;
                    totalPayoutDebitsFromAvailable += payout.Amount;
                    expectedImpact[AccountType.MerchantBlocked] += payout.Amount;
                    totalPayoutsAmount += payout.Amount;
                    totalPayoutsCount++;
                    break;

                case PayoutStatus.Completed:
                    expectedImpact[AccountType.MerchantAvailable] -= payout.Amount;
                    totalPayoutDebitsFromAvailable += payout.Amount;
                    expectedImpact[AccountType.MerchantPayoutsOut] += payout.NetAmount;
                    totalPayoutsAmount += payout.Amount;
                    totalPayoutsCount++;
                    break;
            }

            AddToBalances(expectedBalances, expectedImpact);

            var payoutBucketKey = NormalizeBucketKey(payout.MerchantAcquirerId);

            if (!expectedBalancesByBucket.TryGetValue(payoutBucketKey, out var expectedBucketBalances))
            {
                expectedBucketBalances = BuildZeroBalances();
                expectedBalancesByBucket[payoutBucketKey] = expectedBucketBalances;
            }

            AddToBalances(expectedBucketBalances, expectedImpact);

            var expectedImpactByBucket = new Dictionary<Guid, Dictionary<AccountType, long>>
            {
                [payoutBucketKey] = expectedImpact
            };

            var actualImpactByBucket = payoutImpacts.GetValueOrDefault(payout.Id, []);
            var deltaByBucket = BuildDeltaByBucket(expectedImpactByBucket, actualImpactByBucket);

            foreach (var (bucketId, bucketDelta) in deltaByBucket)
            {
                if (!HasAnyExpectedImpact(bucketDelta))
                {
                    continue;
                }

                payoutDeltas.Add(new ReconciliationDelta
                {
                    MerchantAcquirerId = bucketId,
                    Delta = bucketDelta,
                    PayoutId = payout.Id
                });
            }

            var actualImpact = actualImpactByBucket.TryGetValue(payoutBucketKey, out var actualExpectedBucket)
                ? actualExpectedBucket
                : BuildZeroBalances();

            var mustHaveImpact = payout.Status is PayoutStatus.Pending or PayoutStatus.Processing or PayoutStatus.Confirming or PayoutStatus.Completed;
            if (mustHaveImpact && !HasAnyExpectedImpact(actualImpact))
            {
                discrepancies.Add(CreateDiscrepancy(
                    reconciliation.Id,
                    ReconciliationDiscrepancyType.PayoutNotInLedger,
                    ReconciliationDiscrepancySeverity.Error,
                    $"Saque {payout.Id} ({payout.Status}) sem impacto no ledger para as contas do merchant.",
                    expectedImpact.Values.Sum(),
                    0,
                    expectedImpact.Values.Sum(),
                    payoutId: payout.Id,
                    suggestedAction: "Reprocessar transações deste saque no ledger."));
            }

            foreach (var accountType in TrackedAccountTypes)
            {
                var expected = expectedImpact[accountType];
                var actual = actualImpact[accountType];
                if (expected == actual)
                {
                    continue;
                }

                discrepancies.Add(CreateDiscrepancy(
                    reconciliation.Id,
                    ReconciliationDiscrepancyType.AmountMismatch,
                    ReconciliationDiscrepancySeverity.Error,
                    $"Saque {payout.Id} com impacto divergente em {accountType}.",
                    expected,
                    actual,
                    expected - actual,
                    payoutId: payout.Id,
                    suggestedAction: "Ajustar saldo via correção automática da reconciliação."));
            }

            var shouldBeNeutral = payout.Status is PayoutStatus.Failed or PayoutStatus.Rejected or PayoutStatus.Cancelled;
            if (shouldBeNeutral && HasAnyExpectedImpact(actualImpact))
            {
                var actualNet = actualImpact.Values.Sum(v => Math.Abs(v));
                discrepancies.Add(CreateDiscrepancy(
                    reconciliation.Id,
                    ReconciliationDiscrepancyType.MissingReversal,
                    ReconciliationDiscrepancySeverity.Critical,
                    $"Saque {payout.Id} ({payout.Status}) deveria estar neutro, mas ainda impacta as contas do merchant.",
                    0,
                    actualNet,
                    -actualNet,
                    payoutId: payout.Id,
                    suggestedAction: "Verificar reversão/estorno do saque no ledger."));
            }
        }

        var accountIds = accounts.Select(a => a.Id).ToHashSet();
        var adjustmentTransactions = await _dbContext.LedgerTransactions
            .Include(lt => lt.LedgerEntries)
            .Where(lt => lt.Operation == LedgerTransactionOperation.MerchantAdjustment
                      && lt.LedgerEntries.Any(e => accountIds.Contains(e.AccountId)))
            .ToListAsync(ct);

        long totalAdjustmentsAmount = 0;
        int totalAdjustmentsCount = 0;
        long totalManualAdjustmentOnAvailable = 0;

        foreach (var adjustmentTx in adjustmentTransactions)
        {
            totalAdjustmentsCount++;
            totalAdjustmentsAmount += adjustmentTx.Amount;

            foreach (var entry in adjustmentTx.LedgerEntries)
            {
                if (!accountMetaById.TryGetValue(entry.AccountId, out var meta))
                    continue;

                if (!TrackedAccountTypes.Contains(meta.Type))
                    continue;

                var signedAmount = entry.Type == LedgerEntryType.Credit ? entry.Amount : -entry.Amount;
                expectedBalances[meta.Type] += signedAmount;

                if (meta.Type == AccountType.MerchantAvailable)
                {
                    totalManualAdjustmentOnAvailable += signedAmount;
                }

                if (!expectedBalancesByBucket.TryGetValue(meta.BucketKey, out var bucketBalances))
                {
                    bucketBalances = BuildZeroBalances();
                    expectedBalancesByBucket[meta.BucketKey] = bucketBalances;
                }

                bucketBalances[meta.Type] += signedAmount;
            }
        }

        foreach (var accountType in TrackedAccountTypes)
        {
            var expected = expectedBalances.GetValueOrDefault(accountType);
            var actual = currentBalances.GetValueOrDefault(accountType);
            if (expected == actual)
            {
                continue;
            }

            var discrepancyType = accountType switch
            {
                AccountType.MerchantPending => ReconciliationDiscrepancyType.PendingMismatch,
                AccountType.MerchantBlocked => ReconciliationDiscrepancyType.BlockedMismatch,
                AccountType.MerchantPayoutsOut => ReconciliationDiscrepancyType.PayoutsOutMismatch,
                _ => ReconciliationDiscrepancyType.BalanceMismatch,
            };

            discrepancies.Add(CreateDiscrepancy(
                reconciliation.Id,
                discrepancyType,
                Math.Abs(actual - expected) > 100 ? ReconciliationDiscrepancySeverity.Critical : ReconciliationDiscrepancySeverity.Error,
                $"Conta {accountType} divergente: atual {FormatUtils.FormatCurrency(actual)} vs calculado {FormatUtils.FormatCurrency(expected)}.",
                expected,
                actual,
                actual - expected,
                suggestedAction: "Aplicar correção para alinhar o saldo calculado."));
        }

        var availableBalance = currentBalances.GetValueOrDefault(AccountType.MerchantAvailable);
        var maxSupportedOutflow = totalNetInflowToAvailable + totalManualAdjustmentOnAvailable;
        if (totalPayoutDebitsFromAvailable > maxSupportedOutflow)
        {
            var exceededAmount = totalPayoutDebitsFromAvailable - maxSupportedOutflow;
            discrepancies.Add(CreateDiscrepancy(
                reconciliation.Id,
                ReconciliationDiscrepancyType.WithdrawalExceedsInflow,
                ReconciliationDiscrepancySeverity.Critical,
                $"Saques acima da entrada líquida: entradas+ajustes {FormatUtils.FormatCurrency(maxSupportedOutflow)} vs saídas {FormatUtils.FormatCurrency(totalPayoutDebitsFromAvailable)} (diferença {FormatUtils.FormatCurrency(exceededAmount)}).",
                maxSupportedOutflow,
                totalPayoutDebitsFromAvailable,
                exceededAmount,
                suggestedAction: "Auditar payouts pendentes/concluídos e movimentos manuais para identificar a origem do overdraw."));
        }

        if (availableBalance < 0)
        {
            discrepancies.Add(CreateDiscrepancy(
                reconciliation.Id,
                ReconciliationDiscrepancyType.NegativeAvailableBalance,
                ReconciliationDiscrepancySeverity.Critical,
                $"Conta MerchantAvailable negativa: {FormatUtils.FormatCurrency(availableBalance)}. O volume de saída ultrapassa a disponibilidade operacional.",
                0,
                availableBalance,
                availableBalance,
                suggestedAction: "Revisar saques aprovados/concluídos e estornos de bloqueio para identificar overdraw."));
        }

        return new ReconciliationComputation
        {
            CurrentBalances = currentBalances,
            CurrentBalancesByBucket = currentBalancesByBucket,
            ExpectedBalances = expectedBalances,
            ExpectedBalancesByBucket = expectedBalancesByBucket,
            Discrepancies = discrepancies,
            TotalPaymentsAmount = totalPaymentsAmount,
            TotalPaymentsCount = totalPaymentsCount,
            TotalFeesAmount = totalFeesAmount,
            TotalRefundsAmount = totalRefundsAmount,
            TotalRefundsCount = totalRefundsCount,
            TotalPayoutsAmount = totalPayoutsAmount,
            TotalPayoutsCount = totalPayoutsCount,
            TotalAdjustmentsAmount = totalAdjustmentsAmount,
            TotalAdjustmentsCount = totalAdjustmentsCount,
            TotalLedgerTransactionsCount = ledgerTransactions.Count,
            PaymentDeltas = paymentDeltas,
            PayoutDeltas = payoutDeltas
        };
    }

    private async Task<AdjustmentSummary> ApplyLedgerAdjustments(
        BankReconciliation reconciliation,
        ReconciliationComputation computation,
        Dictionary<Guid, BucketAccounts> accountsByBucket,
        DateTime now)
    {
        var summary = new AdjustmentSummary();
        var scheduledDeltasByBucket = new Dictionary<Guid, Dictionary<AccountType, long>>();
        var requiredDeltasByBucket = BuildDeltaByBucket(
            computation.ExpectedBalancesByBucket,
            computation.CurrentBalancesByBucket);

        foreach (var paymentDelta in computation.PaymentDeltas)
        {
            var bucketAccounts = accountsByBucket.GetValueOrDefault(paymentDelta.MerchantAcquirerId);
            if (bucketAccounts == null)
            {
                continue;
            }

            var created = await CreateAdjustmentTransaction(
                reconciliation,
                bucketAccounts.PrimaryAccounts,
                paymentDelta.Delta,
                now,
                paymentId: paymentDelta.PaymentId);
            summary.Count += created.Count;
            summary.Amount += created.Amount;
            AddBucketDelta(scheduledDeltasByBucket, paymentDelta.MerchantAcquirerId, paymentDelta.Delta);
        }

        foreach (var payoutDelta in computation.PayoutDeltas)
        {
            var bucketAccounts = accountsByBucket.GetValueOrDefault(payoutDelta.MerchantAcquirerId);
            if (bucketAccounts == null)
            {
                continue;
            }

            var created = await CreateAdjustmentTransaction(
                reconciliation,
                bucketAccounts.PrimaryAccounts,
                payoutDelta.Delta,
                now,
                payoutId: payoutDelta.PayoutId);
            summary.Count += created.Count;
            summary.Amount += created.Amount;
            AddBucketDelta(scheduledDeltasByBucket, payoutDelta.MerchantAcquirerId, payoutDelta.Delta);
        }

        foreach (var (bucketId, requiredDelta) in requiredDeltasByBucket)
        {
            var bucketAccounts = accountsByBucket.GetValueOrDefault(bucketId);
            if (bucketAccounts == null)
            {
                continue;
            }

            var scheduledDelta = scheduledDeltasByBucket.GetValueOrDefault(bucketId) ?? BuildZeroBalances();
            var residualDelta = BuildDelta(requiredDelta, scheduledDelta);

            if (!HasAnyExpectedImpact(residualDelta))
            {
                continue;
            }

            var created = await CreateAdjustmentTransaction(
                reconciliation,
                bucketAccounts.PrimaryAccounts,
                residualDelta,
                now);
            summary.Count += created.Count;
            summary.Amount += created.Amount;
        }

        return summary;
    }

    private async Task<AdjustmentSummary> CreateAdjustmentTransaction(
        BankReconciliation reconciliation,
        Dictionary<AccountType, Account> accounts,
        Dictionary<AccountType, long> delta,
        DateTime now,
        Guid? paymentId = null,
        Guid? payoutId = null)
    {
        var entries = new List<LedgerEntry>();
        var balanceUpdates = new List<(Guid AccountId, long Delta)>();

        foreach (var accountType in TrackedAccountTypes)
        {
            var accountDelta = delta.GetValueOrDefault(accountType);
            if (accountDelta == 0)
            {
                continue;
            }

            var account = accounts[accountType];
            var entryType = accountDelta > 0 ? LedgerEntryType.Credit : LedgerEntryType.Debit;
            var amount = Math.Abs(accountDelta);

            entries.Add(new LedgerEntry
            {
                AccountId = account.Id,
                Type = entryType,
                Amount = amount,
                Timestamp = now,
                Description = $"Ajuste automático da reconciliação {reconciliation.Id} em {accountType}"
            });
            balanceUpdates.Add((account.Id, accountDelta));
        }

        if (entries.Count == 0)
        {
            return new AdjustmentSummary();
        }

        await _ledgerRepository.CreateTransactionWithAtomicBalanceUpdateAsync(
            paymentId.HasValue || payoutId.HasValue
                ? LedgerTransactionOperation.Reversal
                : LedgerTransactionOperation.MerchantAdjustment,
            entries.Sum(e => e.Amount),
            entries,
            balanceUpdates,
            paymentId: paymentId,
            payoutId: payoutId,
            notes: $"ReconciliationAdjustment:{reconciliation.Id}");

        return new AdjustmentSummary
        {
            Count = 1,
            Amount = entries.Sum(e => e.Amount)
        };
    }

    private async Task<Dictionary<Guid, BucketAccounts>> GetOrCreateTrackedMerchantAccountsByBucketAsync(
        Guid merchantId,
        ApiEnvironment environment,
        IReadOnlyCollection<Guid> bucketIds,
        CancellationToken ct)
    {
        var existingAccounts = await _dbContext.Accounts
            .Where(a => a.MerchantId == merchantId && TrackedAccountTypes.Contains(a.Type))
            .ToListAsync(ct);

        var allBucketIds = existingAccounts
            .Select(a => NormalizeBucketKey(a.MerchantAcquirerId))
            .Concat(bucketIds)
            .Distinct()
            .ToList();

        var buckets = new Dictionary<Guid, BucketAccounts>();

        foreach (var bucketId in allBucketIds)
        {
            var bucketExistingAccounts = existingAccounts.Where(a => NormalizeBucketKey(a.MerchantAcquirerId) == bucketId).ToList();
            var primaryAccounts = new Dictionary<AccountType, Account>();
            var secondaryBalances = BuildZeroBalances();

            foreach (var accountType in TrackedAccountTypes)
            {
                var groupedAccounts = bucketExistingAccounts
                    .Where(a => a.Type == accountType)
                    .OrderByDescending(a => a.UpdatedAt)
                    .ThenByDescending(a => a.CreatedAt)
                    .ToList();

                var bucketMerchantAcquirerId = DenormalizeBucketKey(bucketId);

                if (groupedAccounts.Count == 0)
                {
                    var account = new Account
                    {
                        Id = Guid.CreateVersion7(),
                        MerchantId = merchantId,
                        MerchantAcquirerId = bucketMerchantAcquirerId,
                        Type = accountType,
                        Currency = CurrencyType.BRL,
                        Balance = 0,
                        Environment = environment,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    _dbContext.Accounts.Add(account);
                    primaryAccounts[accountType] = account;
                    continue;
                }

                primaryAccounts[accountType] = groupedAccounts[0];
                if (groupedAccounts.Count > 1)
                {
                    secondaryBalances[accountType] = groupedAccounts.Skip(1).Sum(a => a.Balance);
                    _logger.LogError(
                        "Multiple merchant accounts detected for reconciliation. MerchantId={MerchantId}, Environment={Environment}, MerchantAcquirerId={MerchantAcquirerId}, AccountType={AccountType}, Count={Count}",
                        merchantId,
                        environment,
                        bucketMerchantAcquirerId,
                        accountType,
                        groupedAccounts.Count);
                }
            }

            buckets[bucketId] = new BucketAccounts
            {
                PrimaryAccounts = primaryAccounts,
                SecondaryBalances = secondaryBalances
            };
        }

        return buckets;
    }

    private static Dictionary<Guid, Dictionary<AccountType, long>> SumLedgerImpactByBucket(
        IEnumerable<LedgerEntry> entries,
        Dictionary<Guid, AccountMeta> accountMetaById)
    {
        var impactByBucket = new Dictionary<Guid, Dictionary<AccountType, long>>();

        foreach (var entry in entries)
        {
            if (!accountMetaById.TryGetValue(entry.AccountId, out var accountMeta))
            {
                continue;
            }

            var accountType = accountMeta.Type;
            if (!TrackedAccountTypes.Contains(accountType))
            {
                continue;
            }

            if (!impactByBucket.TryGetValue(accountMeta.BucketKey, out var bucketImpact))
            {
                bucketImpact = BuildZeroBalances();
                impactByBucket[accountMeta.BucketKey] = bucketImpact;
            }

            var signedAmount = entry.Type == LedgerEntryType.Credit ? entry.Amount : -entry.Amount;
            bucketImpact[accountType] += signedAmount;
        }

        return impactByBucket;
    }

    private static bool HasAnyExpectedImpact(Dictionary<AccountType, long> balances)
        => balances.Values.Any(v => v != 0);

    private static void AddBucketDelta(
        Dictionary<Guid, Dictionary<AccountType, long>> target,
        Guid bucketId,
        Dictionary<AccountType, long> delta)
    {
        if (!target.TryGetValue(bucketId, out var bucketDelta))
        {
            bucketDelta = BuildZeroBalances();
            target[bucketId] = bucketDelta;
        }

        AddToBalances(bucketDelta, delta);
    }

    private static void AddToBalances(Dictionary<AccountType, long> target, Dictionary<AccountType, long> delta)
    {
        foreach (var accountType in TrackedAccountTypes)
        {
            target[accountType] += delta.GetValueOrDefault(accountType);
        }
    }

    private static Dictionary<AccountType, long> BuildDelta(Dictionary<AccountType, long> expected, Dictionary<AccountType, long> actual)
    {
        var delta = BuildZeroBalances();
        foreach (var accountType in TrackedAccountTypes)
        {
            delta[accountType] = expected.GetValueOrDefault(accountType) - actual.GetValueOrDefault(accountType);
        }

        return delta;
    }

    private static Dictionary<Guid, Dictionary<AccountType, long>> BuildDeltaByBucket(
        Dictionary<Guid, Dictionary<AccountType, long>> expected,
        Dictionary<Guid, Dictionary<AccountType, long>> actual)
    {
        var delta = new Dictionary<Guid, Dictionary<AccountType, long>>();
        var keys = expected.Keys.Concat(actual.Keys).Distinct();

        foreach (var key in keys)
        {
            delta[key] = BuildDelta(
                expected.GetValueOrDefault(key, BuildZeroBalances()),
                actual.GetValueOrDefault(key, BuildZeroBalances()));
        }

        return delta;
    }

    private static Dictionary<AccountType, long> BuildZeroBalances()
        => TrackedAccountTypes.ToDictionary(t => t, _ => 0L);

    private static long CalculateRefundNetAmount(Payment payment)
    {
        if (payment.RefundedAmount <= 0 || payment.Amount <= 0 || payment.NetAmount <= 0)
        {
            return 0;
        }

        if (payment.Status == PaymentStatus.Refunded)
        {
            return payment.NetAmount;
        }

        var refundProportion = (decimal)payment.RefundedAmount / payment.Amount;
        return (long)(payment.NetAmount * refundProportion);
    }

    private static BankReconciliationDiscrepancy CreateDiscrepancy(
        Guid reconciliationId,
        ReconciliationDiscrepancyType type,
        ReconciliationDiscrepancySeverity severity,
        string description,
        long expectedAmount,
        long actualAmount,
        long difference,
        Guid? paymentId = null,
        Guid? payoutId = null,
        string? ledgerTransactionId = null,
        string? suggestedAction = null)
    {
        return new BankReconciliationDiscrepancy
        {
            Id = Guid.CreateVersion7(),
            BankReconciliationId = reconciliationId,
            Type = type,
            Severity = severity,
            Description = description,
            PaymentId = paymentId,
            PayoutId = payoutId,
            LedgerTransactionId = ledgerTransactionId,
            ExpectedAmount = expectedAmount,
            ActualAmount = actualAmount,
            Difference = difference,
            SuggestedAction = suggestedAction,
            CreatedAt = DateTime.UtcNow
        };
    }

    public async Task<StartAllReconciliationsResult> StartReconciliationForAllMerchantsAsync(
        Guid requestedByUserId,
        bool silentMode = false,
        CancellationToken ct = default)
    {
        var environment = _environmentProvider.CurrentEnvironment;

        var merchants = await _dbContext.Merchants
            .Where(m => m.Status == MerchantStatus.Active)
            .Where(m => _dbContext.Accounts.Any(a => a.MerchantId == m.Id))
            .Select(m => new { m.Id, m.Name })
            .ToListAsync(ct);

        var result = new StartAllReconciliationsResult
        {
            TotalMerchants = merchants.Count
        };

        foreach (var merchant in merchants)
        {
            try
            {
                var hasPending = await _dbContext.BankReconciliations
                    .AnyAsync(br =>
                        br.MerchantId == merchant.Id &&
                        br.Environment == environment &&
                        (br.Status == BankReconciliationStatus.Pending || br.Status == BankReconciliationStatus.Processing),
                        CancellationToken.None);

                if (hasPending)
                {
                    result.Skipped++;
                    result.Items.Add(new StartAllReconciliationItem
                    {
                        MerchantId = merchant.Id,
                        MerchantName = merchant.Name,
                        Status = "Skipped"
                    });
                    continue;
                }

                var reconciliation = await StartReconciliationAsync(merchant.Id, requestedByUserId, silentMode);

                result.Queued++;
                result.Items.Add(new StartAllReconciliationItem
                {
                    MerchantId = merchant.Id,
                    MerchantName = merchant.Name,
                    Status = "Queued",
                    ReconciliationId = reconciliation.Id
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error starting reconciliation for merchant {MerchantId}", merchant.Id);
                result.Errors++;
                result.Items.Add(new StartAllReconciliationItem
                {
                    MerchantId = merchant.Id,
                    MerchantName = merchant.Name,
                    Status = "Error",
                    ErrorMessage = ex.Message
                });
            }
        }

        return result;
    }

    private sealed class ReconciliationComputation
    {
        public Dictionary<AccountType, long> CurrentBalances { get; init; } = BuildZeroBalances();
        public Dictionary<Guid, Dictionary<AccountType, long>> CurrentBalancesByBucket { get; init; } = [];
        public Dictionary<AccountType, long> ExpectedBalances { get; init; } = BuildZeroBalances();
        public Dictionary<Guid, Dictionary<AccountType, long>> ExpectedBalancesByBucket { get; init; } = [];
        public List<BankReconciliationDiscrepancy> Discrepancies { get; init; } = [];
        public long TotalPaymentsAmount { get; init; }
        public int TotalPaymentsCount { get; init; }
        public long TotalFeesAmount { get; init; }
        public long TotalRefundsAmount { get; init; }
        public int TotalRefundsCount { get; init; }
        public long TotalPayoutsAmount { get; init; }
        public int TotalPayoutsCount { get; init; }
        public long TotalAdjustmentsAmount { get; init; }
        public int TotalAdjustmentsCount { get; init; }
        public int TotalLedgerTransactionsCount { get; init; }
        public List<ReconciliationDelta> PaymentDeltas { get; init; } = [];
        public List<ReconciliationDelta> PayoutDeltas { get; init; } = [];
    }

    private sealed class ReconciliationDelta
    {
        public Guid MerchantAcquirerId { get; init; }
        public Dictionary<AccountType, long> Delta { get; init; } = BuildZeroBalances();
        public Guid? PaymentId { get; init; }
        public Guid? PayoutId { get; init; }
    }

    private sealed class BucketAccounts
    {
        public Dictionary<AccountType, Account> PrimaryAccounts { get; init; } = [];
        public Dictionary<AccountType, long> SecondaryBalances { get; init; } = BuildZeroBalances();
    }

    private sealed class AccountMeta
    {
        public AccountMeta(AccountType type, Guid bucketKey)
        {
            Type = type;
            BucketKey = bucketKey;
        }

        public AccountType Type { get; }
        public Guid BucketKey { get; }
    }

    private static Guid NormalizeBucketKey(Guid? merchantAcquirerId)
        => merchantAcquirerId ?? Guid.Empty;

    private static Guid? DenormalizeBucketKey(Guid bucketKey)
        => bucketKey == Guid.Empty ? null : bucketKey;

    private sealed class AdjustmentSummary
    {
        public int Count { get; set; }
        public long Amount { get; set; }
    }
}
