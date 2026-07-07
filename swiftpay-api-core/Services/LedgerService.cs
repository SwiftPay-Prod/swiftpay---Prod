using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Npgsql;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Models.Ledger;
using swiftpay_api_core.Utils;

namespace swiftpay_api_core.Services;

public class LedgerService(
    ILedgerRepository ledgerRepository,
    PrimaryDbContext dbContext,
    ICalculationService calculationService,
    IEnvironmentProvider environmentProvider,
    ILogger<LedgerService> logger
) : ILedgerService
{
    private const string UniquePayoutSettlementOutConstraint = "IX_LedgerTransactions_PayoutId_SettlementOut_Unique";

    private ApiEnvironment Environment => environmentProvider.CurrentEnvironment;

    private sealed record MerchantCompensationCandidate(
        Guid MerchantAcquirerId,
        PaymentMethod Method,
        PaymentStatus Status,
        DateTime CompletedAt,
        long Amount,
        long PlatformFee,
        long CheckoutTemplateFee,
        long RefundedAmount,
        long MerchantSettlementAmount,
        bool PixHasCompensation,
        int PixCompensationDays,
        bool BoletoHasCompensation,
        int BoletoCompensationDays,
        bool CreditCardHasCompensation,
        int CreditCardCompensationDays);

    private async Task<Dictionary<Guid, long>> GetMerchantCompensationLockedAmountsAsync(Guid merchantId)
    {
        var candidates = await dbContext.Payments
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(payment => payment.MerchantId == merchantId
                && payment.Environment == Environment
                && payment.CompletedAt.HasValue
                && (payment.Status == PaymentStatus.Completed || payment.Status == PaymentStatus.PartiallyRefunded))
            .Join(
                dbContext.MerchantAcquirers.IgnoreQueryFilters().AsNoTracking(),
                payment => payment.MerchantAcquirerId,
                merchantAcquirer => merchantAcquirer.Id,
                (payment, merchantAcquirer) => new
                {
                    Payment = payment,
                    merchantAcquirer.AcquirerId
                })
            .Join(
                dbContext.Acquirers.IgnoreQueryFilters().AsNoTracking(),
                entry => entry.AcquirerId,
                acquirer => acquirer.Id,
                (entry, acquirer) => new MerchantCompensationCandidate(
                    entry.Payment.MerchantAcquirerId,
                    entry.Payment.Method,
                    entry.Payment.Status,
                    entry.Payment.CompletedAt!.Value,
                    entry.Payment.Amount,
                    entry.Payment.PlatformFee,
                    entry.Payment.CheckoutTemplateFee,
                    entry.Payment.RefundedAmount,
                    entry.Payment.MerchantSettlementAmount,
                    acquirer.PixHasCompensation,
                    acquirer.PixCompensationDays,
                    acquirer.BoletoHasCompensation,
                    acquirer.BoletoCompensationDays,
                    acquirer.CreditCardHasCompensation,
                    acquirer.CreditCardCompensationDays))
            .ToListAsync();

        if (candidates.Count == 0)
            return [];

        var now = DateTime.UtcNow;
        var lockedAmounts = new Dictionary<Guid, long>();

        foreach (var candidate in candidates)
        {
            var compensationDays = ResolveCompensationDays(candidate);
            if (compensationDays <= 0)
                continue;

            if (candidate.CompletedAt.AddDays(compensationDays) <= now)
                continue;

            var lockedAmount = CalculateLockedSettlementAmount(candidate);
            if (lockedAmount <= 0)
                continue;

            lockedAmounts[candidate.MerchantAcquirerId] = lockedAmounts.GetValueOrDefault(candidate.MerchantAcquirerId) + lockedAmount;
        }

        return lockedAmounts;
    }

    private static int ResolveCompensationDays(MerchantCompensationCandidate candidate)
    {
        return candidate.Method switch
        {
            PaymentMethod.Pix when candidate.PixHasCompensation => candidate.PixCompensationDays,
            PaymentMethod.Boleto when candidate.BoletoHasCompensation => candidate.BoletoCompensationDays,
            PaymentMethod.CreditCard when candidate.CreditCardHasCompensation => candidate.CreditCardCompensationDays,
            _ => 0
        };
    }

    private static long CalculateLockedSettlementAmount(MerchantCompensationCandidate candidate)
    {
        var settlementAmount = candidate.MerchantSettlementAmount > 0
            ? candidate.MerchantSettlementAmount
            : FeeCalculator.CalculateNetAmount(candidate.Amount, candidate.PlatformFee, candidate.CheckoutTemplateFee);

        if (settlementAmount <= 0)
            return 0;

        if (candidate.Status != PaymentStatus.PartiallyRefunded || candidate.RefundedAmount <= 0 || candidate.Amount <= 0)
            return settlementAmount;

        var normalizedRefundedAmount = Math.Min(candidate.RefundedAmount, candidate.Amount);
        var refundProportion = (decimal)normalizedRefundedAmount / candidate.Amount;
        var refundedSettlementAmount = (long)(settlementAmount * refundProportion);

        return Math.Max(0, settlementAmount - refundedSettlementAmount);
    }

    private static long ResolveMerchantReserveAmount(long netAmount, long settlementAmount)
    {
        if (netAmount <= 0 || settlementAmount <= 0)
            return 0;

        return Math.Max(0, netAmount - settlementAmount);
    }

    private sealed record MerchantRefundDebits(long ReservedDebit, long AvailableDebit);

    private static MerchantRefundDebits BuildMerchantRefundDebits(long debitAmount, long reservedBalance)
    {
        if (debitAmount <= 0)
            return new MerchantRefundDebits(0, 0);

        var reservedDebit = Math.Min(Math.Max(0, reservedBalance), debitAmount);
        var availableDebit = debitAmount - reservedDebit;

        return new MerchantRefundDebits(reservedDebit, availableDebit);
    }

    public async Task<LedgerTransactionResult> RecordPaymentPendingAsync(
        Guid merchantId,
        Guid merchantAcquirerId,
        Guid paymentId,
        long amount,
        long fee,
        string description,
        long? merchantSettlementAmount = null)
    {
        try
        {
            if (await dbContext.LedgerTransactions.IgnoreQueryFilters()
                    .AnyAsync(t => t.PaymentId == paymentId && t.Status == LedgerTransactionStatus.Pending))
                return LedgerTransactionResult.Ok("already-recorded", 0);

            var pendingAccount = await ledgerRepository.GetOrCreateMerchantPendingAccountAsync(merchantId, Environment, merchantAcquirerId);

            var netAmount = amount - fee;
            var pendingAmount = Math.Max(0, netAmount);
            var now = DateTime.UtcNow;
            var transactionId = $"tx-{Guid.CreateVersion7()}";

            var entries = new List<LedgerEntry>
            {
                new()
                {
                    LedgerTransactionId = transactionId,
                    AccountId = pendingAccount.Id,
                    Type = LedgerEntryType.Credit,
                    Amount = pendingAmount,
                    Timestamp = now,
                    Description = $"Pagamento pendente"
                }
            };

            var balanceUpdates = new List<(Guid AccountId, long Delta)>
            {
                (pendingAccount.Id, pendingAmount)
            };

            await ledgerRepository.CreateTransactionWithAtomicBalanceUpdateAsync(
                LedgerTransactionOperation.PixIn,
                pendingAmount,
                entries,
                balanceUpdates,
                paymentId: paymentId,
                status: LedgerTransactionStatus.Pending);

            var newPendingBalance = await ledgerRepository.GetAccountBalanceAsync(pendingAccount.Id);

            return LedgerTransactionResult.Ok(transactionId, newPendingBalance);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error recording pending payment in ledger: PaymentId={PaymentId}", paymentId);
            return LedgerTransactionResult.Fail("Erro ao registrar pagamento pendente no ledger.");
        }
    }

    public async Task<LedgerTransactionResult> RecordPaymentCancelledAsync(
        Guid merchantId,
        Guid merchantAcquirerId,
        Guid paymentId,
        long amount,
        long fee,
        string description,
        long? merchantSettlementAmount = null)
    {
        try
        {
            if (await dbContext.LedgerTransactions.IgnoreQueryFilters()
                    .AnyAsync(t => t.PaymentId == paymentId && t.Status == LedgerTransactionStatus.Refused))
                return LedgerTransactionResult.Ok("already-recorded", 0);

            var pendingAccount = await ledgerRepository.GetOrCreateMerchantPendingAccountAsync(merchantId, Environment, merchantAcquirerId);

            var netAmount = amount - fee;
            var pendingAmount = Math.Max(0, netAmount);
            var now = DateTime.UtcNow;
            var transactionId = $"tx-{Guid.CreateVersion7()}";

            var entries = new List<LedgerEntry>
            {
                new()
                {
                    LedgerTransactionId = transactionId,
                    AccountId = pendingAccount.Id,
                    Type = LedgerEntryType.Debit,
                    Amount = pendingAmount,
                    Timestamp = now,
                    Description = $"Pagamento cancelado"
                }
            };

            var balanceUpdates = new List<(Guid AccountId, long Delta)>
            {
                (pendingAccount.Id, -pendingAmount)
            };

            await ledgerRepository.CreateTransactionWithAtomicBalanceUpdateAsync(
                LedgerTransactionOperation.PixIn,
                pendingAmount,
                entries,
                balanceUpdates,
                paymentId: paymentId,
                status: LedgerTransactionStatus.Refused);

            var newPendingBalance = await ledgerRepository.GetAccountBalanceAsync(pendingAccount.Id);

            return LedgerTransactionResult.Ok(transactionId, newPendingBalance);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error recording payment cancellation in ledger: PaymentId={PaymentId}", paymentId);
            return LedgerTransactionResult.Fail("Erro ao registrar cancelamento do pagamento no ledger.");
        }
    }

    public async Task<LedgerTransactionResult> RecordPaymentReceivedAsync(
        Guid merchantId,
        Guid merchantAcquirerId,
        Guid paymentId,
        Guid? acquirerId,
        long amount,
        long platformFee,
        long acquirerFee,
        long? merchantSettlementAmount,
        string description,
        PaymentFeeSplitHandling feeSplitHandling = PaymentFeeSplitHandling.None,
        bool platformOnly = false)
    {
        try
        {
            if (await dbContext.LedgerTransactions.IgnoreQueryFilters()
                    .AnyAsync(t => t.PaymentId == paymentId
                                && t.Operation == LedgerTransactionOperation.PixIn
                                && t.Status == LedgerTransactionStatus.Approved))
                return LedgerTransactionResult.Ok("already-recorded", 0);

            var netAmount = FeeCalculator.CalculateNetAmount(amount, platformFee);
            var settlementAmount = Math.Max(0, merchantSettlementAmount ?? netAmount);
            var reserveAmount = ResolveMerchantReserveAmount(netAmount, settlementAmount);
            var pendingAmount = settlementAmount + reserveAmount;
            var now = DateTime.UtcNow;
            var transactionId = $"tx-{Guid.CreateVersion7()}";

            var entries = new List<LedgerEntry>();
            var balanceUpdates = new List<(Guid AccountId, long Delta)>();

            if (!platformOnly)
            {
                var pendingAccount = await ledgerRepository.GetOrCreateMerchantPendingAccountAsync(merchantId, Environment, merchantAcquirerId);
                var merchantAccount = await ledgerRepository.GetOrCreateMerchantAvailableAccountAsync(merchantId, Environment, merchantAcquirerId);
                var merchantReservedAccount = await ledgerRepository.GetOrCreateMerchantReservedAccountAsync(merchantId, Environment, merchantAcquirerId);

                entries.Add(new LedgerEntry
                {
                    LedgerTransactionId = transactionId,
                    AccountId = pendingAccount.Id,
                    Type = LedgerEntryType.Debit,
                    Amount = pendingAmount,
                    Timestamp = now,
                    Description = $"Pagamento confirmado (sa�da do pendente)"
                });
                balanceUpdates.Add((pendingAccount.Id, -pendingAmount));

                if (settlementAmount > 0)
                {
                    entries.Add(new LedgerEntry
                    {
                        LedgerTransactionId = transactionId,
                        AccountId = merchantAccount.Id,
                        Type = LedgerEntryType.Credit,
                        Amount = settlementAmount,
                        Timestamp = now,
                        Description = $"PIX recebido (liquido disponivel)"
                    });
                    balanceUpdates.Add((merchantAccount.Id, settlementAmount));
                }

                if (reserveAmount > 0)
                {
                    entries.Add(new LedgerEntry
                    {
                        LedgerTransactionId = transactionId,
                        AccountId = merchantReservedAccount.Id,
                        Type = LedgerEntryType.Credit,
                        Amount = reserveAmount,
                        Timestamp = now,
                        Description = $"PIX recebido (saldo reservado)"
                    });
                    balanceUpdates.Add((merchantReservedAccount.Id, reserveAmount));
                }
            }

            // Registra no AcquirerSettlement (valor l�quido recebido pela adquirente)
            if (acquirerId.HasValue)
            {
                var acquirerSettlementAccount = await ledgerRepository.GetOrCreateAcquirerSettlementAccountAsync(acquirerId.Value, Environment);
                
                var acquirerNetAmount = FeeCalculator.CalculateAcquirerNetAmount(amount, acquirerFee);
                entries.Add(new LedgerEntry
                {
                    LedgerTransactionId = transactionId,
                    AccountId = acquirerSettlementAccount.Id,
                    Type = LedgerEntryType.Credit,
                    Amount = acquirerNetAmount,
                    Timestamp = now,
                    Description = $"PIX recebido (l�quido)"
                });

                balanceUpdates.Add((acquirerSettlementAccount.Id, acquirerNetAmount));
            }

            // Credita o lucro real da plataforma (taxa cobrada do merchant MENOS taxa da adquirente)
            var platformProfit = platformFee - acquirerFee;
            if (platformProfit > 0)
            {
                if (feeSplitHandling == PaymentFeeSplitHandling.AutoSplitToBank)
                {
                    // A adquirente faz split autom�tico e envia a taxa diretamente para a conta banc�ria da Safefy.
                    // Creditamos em PlatformPayoutsOut, pois o valor j� foi transferido para o banco da Safefy.
                    var platformPayoutsOutAccount = await ledgerRepository.GetOrCreatePlatformPayoutsOutAccountAsync(Environment);
                    entries.Add(new LedgerEntry
                    {
                        LedgerTransactionId = transactionId,
                        AccountId = platformPayoutsOutAccount.Id,
                        Type = LedgerEntryType.Credit,
                        Amount = platformProfit,
                        Timestamp = now,
                        Description = $"Lucro do pagamento - split autom�tico (taxa merchant - taxa adquirente)"
                    });
                    balanceUpdates.Add((platformPayoutsOutAccount.Id, platformProfit));

                    // Tamb�m registra em AcquirerPayoutsOut para concilia��o
                    if (acquirerId.HasValue)
                    {
                        var acquirerPayoutsOutAccount = await ledgerRepository.GetOrCreateAcquirerPayoutsOutAccountAsync(acquirerId.Value, Environment);
                        entries.Add(new LedgerEntry
                        {
                            LedgerTransactionId = transactionId,
                            AccountId = acquirerPayoutsOutAccount.Id,
                            Type = LedgerEntryType.Credit,
                            Amount = platformProfit,
                            Timestamp = now,
                            Description = $"Split autom�tico - taxa enviada para conta banc�ria da plataforma"
                        });
                        balanceUpdates.Add((acquirerPayoutsOutAccount.Id, platformProfit));
                    }
                }
            }

            MerchantBalanceDeltas? merchantBalanceDeltas = null;
            if (!platformOnly)
            {
                await ledgerRepository.GetOrCreateMerchantBalanceAsync(merchantId, Environment); // ensures period-reset side effect
                merchantBalanceDeltas = new MerchantBalanceDeltas
                {
                    MerchantId = merchantId,
                    Environment = Environment,
                    LifetimeVolumeDelta = amount,
                    VolumeTodayDelta = amount,
                    VolumeThisWeekDelta = amount,
                    VolumeThisMonthDelta = amount,
                    LifetimeFeesPaidDelta = platformFee > 0 ? platformFee : 0
                };
            }

            await ledgerRepository.CreateTransactionWithAtomicBalanceUpdateAsync(
                LedgerTransactionOperation.PixIn,
                amount,
                entries,
                balanceUpdates,
                merchantBalanceDeltas,
                paymentId: paymentId);

            if (platformOnly)
            {
                return LedgerTransactionResult.Ok(transactionId, 0);
            }

            var merchantAccountAfter = await ledgerRepository.GetOrCreateMerchantAvailableAccountAsync(merchantId, Environment, merchantAcquirerId);
            var newMerchantBalance = await ledgerRepository.GetAccountBalanceAsync(merchantAccountAfter.Id);

            return LedgerTransactionResult.Ok(transactionId, newMerchantBalance);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error recording payment in ledger: PaymentId={PaymentId}", paymentId);
            return LedgerTransactionResult.Fail("Erro ao registrar pagamento no ledger.");
        }
    }

    public async Task<LedgerTransactionResult> RecordPaymentRefundedAsync(
        Guid merchantId,
        Guid merchantAcquirerId,
        Guid paymentId,
        Guid? acquirerId,
        long amount,
        long platformFee,
        long acquirerFee,
        long? merchantSettlementAmount,
        string description,
        PaymentFeeSplitHandling feeSplitHandling = PaymentFeeSplitHandling.None)
    {
        try
        {
            if (await dbContext.LedgerTransactions.IgnoreQueryFilters()
                    .AnyAsync(t => t.PaymentId == paymentId
                                && t.Operation == LedgerTransactionOperation.PixRefund))
                return LedgerTransactionResult.Ok("already-recorded", 0);

            var merchantAccount = await ledgerRepository.GetOrCreateMerchantAvailableAccountAsync(merchantId, Environment, merchantAcquirerId);
            var merchantReservedAccount = await ledgerRepository.GetOrCreateMerchantReservedAccountAsync(merchantId, Environment, merchantAcquirerId);
            
            var netAmount = FeeCalculator.CalculateNetAmount(amount, platformFee);
            var settlementAmount = Math.Max(0, merchantSettlementAmount ?? netAmount);
            var reserveAmount = ResolveMerchantReserveAmount(netAmount, settlementAmount);
            var merchantDebitAmount = settlementAmount + reserveAmount;
            var availableBalance = await ledgerRepository.GetAccountBalanceAsync(merchantAccount.Id);
            var reservedBalance = await ledgerRepository.GetAccountBalanceAsync(merchantReservedAccount.Id);

            if ((availableBalance + reservedBalance) < merchantDebitAmount)
            {
                return LedgerTransactionResult.Fail("Saldo insuficiente para estorno.");
            }

            var debits = BuildMerchantRefundDebits(merchantDebitAmount, reservedBalance);

            var now = DateTime.UtcNow;
            var transactionId = $"tx-{Guid.CreateVersion7()}";

            var entries = new List<LedgerEntry>();

            if (debits.ReservedDebit > 0)
            {
                entries.Add(new LedgerEntry
                {
                    LedgerTransactionId = transactionId,
                    AccountId = merchantReservedAccount.Id,
                    Type = LedgerEntryType.Debit,
                    Amount = debits.ReservedDebit,
                    Timestamp = now,
                    Description = $"Estorno PIX (saldo reservado)"
                });
            }

            if (debits.AvailableDebit > 0)
            {
                entries.Add(new LedgerEntry
                {
                    LedgerTransactionId = transactionId,
                    AccountId = merchantAccount.Id,
                    Type = LedgerEntryType.Debit,
                    Amount = debits.AvailableDebit,
                    Timestamp = now,
                    Description = $"Estorno PIX (saldo disponivel)"
                });
            }

            var balanceUpdates = new List<(Guid AccountId, long Delta)>();
            if (debits.ReservedDebit > 0)
            {
                balanceUpdates.Add((merchantReservedAccount.Id, -debits.ReservedDebit));
            }

            if (debits.AvailableDebit > 0)
            {
                balanceUpdates.Add((merchantAccount.Id, -debits.AvailableDebit));
            }

            if (acquirerId.HasValue)
            {
                var acquirerSettlementAccount = await ledgerRepository.GetOrCreateAcquirerSettlementAccountAsync(acquirerId.Value, Environment);
                
                var acquirerNetAmount = FeeCalculator.CalculateAcquirerNetAmount(amount, acquirerFee);
                
                entries.Add(new LedgerEntry
                {
                    LedgerTransactionId = transactionId,
                    AccountId = acquirerSettlementAccount.Id,
                    Type = LedgerEntryType.Debit,
                    Amount = acquirerNetAmount,
                    Timestamp = now,
                    Description = $"Estorno PIX"
                });

                balanceUpdates.Add((acquirerSettlementAccount.Id, -acquirerNetAmount));
            }

            // Debita o lucro real da plataforma (taxa cobrada do merchant MENOS taxa da adquirente)
            // Usa a mesma conta que foi creditada no pagamento original (depende do feeSplitHandling)
            var platformProfit = platformFee - acquirerFee;
            if (platformProfit > 0)
            {
                if (feeSplitHandling == PaymentFeeSplitHandling.AutoSplitToBank)
                {
                    var platformPayoutsOutAccount = await ledgerRepository.GetOrCreatePlatformPayoutsOutAccountAsync(Environment);
                    entries.Add(new LedgerEntry
                    {
                        LedgerTransactionId = transactionId,
                        AccountId = platformPayoutsOutAccount.Id,
                        Type = LedgerEntryType.Debit,
                        Amount = platformProfit,
                        Timestamp = now,
                        Description = $"Estorno lucro do pagamento"
                    });
                    balanceUpdates.Add((platformPayoutsOutAccount.Id, -platformProfit));
                }
            }

            // Reverte KPIs do MerchantBalance
            await ledgerRepository.GetOrCreateMerchantBalanceAsync(merchantId, Environment); // ensures period-reset side effect
            var merchantBalanceDeltas = new MerchantBalanceDeltas
            {
                MerchantId = merchantId,
                Environment = Environment,
                LifetimeRefundsDelta = amount,
                LifetimeVolumeDelta = -amount,
                VolumeTodayDelta = -amount,
                VolumeThisWeekDelta = -amount,
                VolumeThisMonthDelta = -amount,
                LifetimeFeesPaidDelta = platformFee > 0 ? -platformFee : 0
            };

            await ledgerRepository.CreateTransactionWithAtomicBalanceUpdateAsync(
                LedgerTransactionOperation.PixRefund,
                amount,
                entries,
                balanceUpdates,
                merchantBalanceDeltas,
                paymentId: paymentId);

            var newMerchantBalance = await ledgerRepository.GetAccountBalanceAsync(merchantAccount.Id);

            return LedgerTransactionResult.Ok(transactionId, newMerchantBalance);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error recording refund in ledger: PaymentId={PaymentId}", paymentId);
            return LedgerTransactionResult.Fail("Erro ao registrar estorno no ledger.");
        }
    }

    public async Task<LedgerTransactionResult> RecordPaymentPartiallyRefundedAsync(
        Guid merchantId,
        Guid merchantAcquirerId,
        Guid paymentId,
        Guid? acquirerId,
        long originalAmount,
        long refundedAmount,
        long platformFee,
        long acquirerFee,
        long? merchantSettlementAmount,
        string description,
        PaymentFeeSplitHandling feeSplitHandling = PaymentFeeSplitHandling.None)
    {
        try
        {
            if (await dbContext.LedgerTransactions.IgnoreQueryFilters()
                    .AnyAsync(t => t.PaymentId == paymentId
                                && t.Operation == LedgerTransactionOperation.PixPartialRefund
                                && t.Amount == refundedAmount))
                return LedgerTransactionResult.Ok("already-recorded", 0);

            var merchantAccount = await ledgerRepository.GetOrCreateMerchantAvailableAccountAsync(merchantId, Environment, merchantAcquirerId);
            var merchantReservedAccount = await ledgerRepository.GetOrCreateMerchantReservedAccountAsync(merchantId, Environment, merchantAcquirerId);

            // Calcula proporcionalmente quanto debitar do merchant
            // Se o pagamento era 100, taxa 2, l�quido 98, e reembolsou 50 (50% do valor)
            // Debita 49 (50% do l�quido) do merchant
            var netAmount = FeeCalculator.CalculateNetAmount(originalAmount, platformFee);
            var settlementAmount = Math.Max(0, merchantSettlementAmount ?? netAmount);
            var reserveAmount = ResolveMerchantReserveAmount(netAmount, settlementAmount);
            var merchantOwnedAmount = settlementAmount + reserveAmount;
            var refundProportion = (decimal)refundedAmount / originalAmount;
            var merchantDebitAmount = calculationService.CalculateRefundedMerchantSettlementAmount(
                merchantOwnedAmount,
                originalAmount,
                refundedAmount);

            var availableBalance = await ledgerRepository.GetAccountBalanceAsync(merchantAccount.Id);
            var reservedBalance = await ledgerRepository.GetAccountBalanceAsync(merchantReservedAccount.Id);

            if ((availableBalance + reservedBalance) < merchantDebitAmount)
            {
                return LedgerTransactionResult.Fail("Saldo insuficiente para estorno parcial.");
            }

            var debits = BuildMerchantRefundDebits(merchantDebitAmount, reservedBalance);

            var now = DateTime.UtcNow;
            var transactionId = $"tx-{Guid.CreateVersion7()}";

            var entries = new List<LedgerEntry>();

            if (debits.ReservedDebit > 0)
            {
                entries.Add(new LedgerEntry
                {
                    LedgerTransactionId = transactionId,
                    AccountId = merchantReservedAccount.Id,
                    Type = LedgerEntryType.Debit,
                    Amount = debits.ReservedDebit,
                    Timestamp = now,
                    Description = $"Estorno parcial PIX reservado ({refundProportion:P0})"
                });
            }

            if (debits.AvailableDebit > 0)
            {
                entries.Add(new LedgerEntry
                {
                    LedgerTransactionId = transactionId,
                    AccountId = merchantAccount.Id,
                    Type = LedgerEntryType.Debit,
                    Amount = debits.AvailableDebit,
                    Timestamp = now,
                    Description = $"Estorno parcial PIX disponivel ({refundProportion:P0})"
                });
            }

            var balanceUpdates = new List<(Guid AccountId, long Delta)>();
            if (debits.ReservedDebit > 0)
            {
                balanceUpdates.Add((merchantReservedAccount.Id, -debits.ReservedDebit));
            }

            if (debits.AvailableDebit > 0)
            {
                balanceUpdates.Add((merchantAccount.Id, -debits.AvailableDebit));
            }

            if (acquirerId.HasValue)
            {
                var acquirerSettlementAccount = await ledgerRepository.GetOrCreateAcquirerSettlementAccountAsync(acquirerId.Value, Environment);

                // Calcula proporcionalmente quanto debitar da adquirente
                var acquirerNetAmount = FeeCalculator.CalculateAcquirerNetAmount(originalAmount, acquirerFee);
                var acquirerDebitAmount = (long)(acquirerNetAmount * refundProportion);

                entries.Add(new LedgerEntry
                {
                    LedgerTransactionId = transactionId,
                    AccountId = acquirerSettlementAccount.Id,
                    Type = LedgerEntryType.Debit,
                    Amount = acquirerDebitAmount,
                    Timestamp = now,
                    Description = $"Estorno parcial PIX ({refundProportion:P0})"
                });

                balanceUpdates.Add((acquirerSettlementAccount.Id, -acquirerDebitAmount));
            }

            // Debita proporcionalmente o lucro real da plataforma
            // Usa a mesma conta que foi creditada no pagamento original (depende do feeSplitHandling)
            var platformProfit = platformFee - acquirerFee;
            if (platformProfit > 0)
            {
                var platformDebitAmount = (long)(platformProfit * refundProportion);
                if (platformDebitAmount > 0)
                {
                    if (feeSplitHandling == PaymentFeeSplitHandling.AutoSplitToBank)
                    {
                        var platformPayoutsOutAccount = await ledgerRepository.GetOrCreatePlatformPayoutsOutAccountAsync(Environment);
                        entries.Add(new LedgerEntry
                        {
                            LedgerTransactionId = transactionId,
                            AccountId = platformPayoutsOutAccount.Id,
                            Type = LedgerEntryType.Debit,
                            Amount = platformDebitAmount,
                            Timestamp = now,
                            Description = $"Estorno parcial lucro ({refundProportion:P0})"
                        });
                        balanceUpdates.Add((platformPayoutsOutAccount.Id, -platformDebitAmount));
                    }
                }
            }

            // Atualiza KPIs do MerchantBalance proporcionalmente
            await ledgerRepository.GetOrCreateMerchantBalanceAsync(merchantId, Environment); // ensures period-reset side effect
            var merchantBalanceDeltas = new MerchantBalanceDeltas
            {
                MerchantId = merchantId,
                Environment = Environment,
                LifetimeRefundsDelta = refundedAmount,
                LifetimeVolumeDelta = -refundedAmount,
                VolumeTodayDelta = -refundedAmount,
                VolumeThisWeekDelta = -refundedAmount,
                VolumeThisMonthDelta = -refundedAmount
                // N�o reverte taxas em reembolso parcial (a taxa foi sobre o valor total)
            };

            await ledgerRepository.CreateTransactionWithAtomicBalanceUpdateAsync(
                LedgerTransactionOperation.PixPartialRefund,
                refundedAmount,
                entries,
                balanceUpdates,
                merchantBalanceDeltas,
                paymentId: paymentId);

            var newMerchantBalance = await ledgerRepository.GetAccountBalanceAsync(merchantAccount.Id);

            return LedgerTransactionResult.Ok(transactionId, newMerchantBalance);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error recording partial refund in ledger: PaymentId={PaymentId}, RefundedAmount={RefundedAmount}", paymentId, refundedAmount);
            return LedgerTransactionResult.Fail("Erro ao registrar estorno parcial no ledger.");
        }
    }

    public async Task<LedgerTransactionResult> RecordWithdrawalRequestedAsync(
        Guid merchantId,
        Guid payoutId,
        Guid merchantAcquirerId,
        long amount,
        long fee,
        string description)
    {
        try
        {
            var availableAccount = await ledgerRepository.GetOrCreateMerchantAvailableAccountAsync(merchantId, Environment, merchantAcquirerId);
            var blockedAccount = await ledgerRepository.GetOrCreateMerchantBlockedAccountAsync(merchantId, Environment, merchantAcquirerId);

            // amount = valor bruto (Amount do Payout) = total a debitar/bloquear
            // fee = taxa da plataforma (apenas para KPI)
            if (!await ledgerRepository.CheckSufficientBalanceAsync(availableAccount.Id, amount))
            {
                return LedgerTransactionResult.Fail("Saldo insuficiente para saque.");
            }

            var now = DateTime.UtcNow;
            var transactionId = $"tx-{Guid.CreateVersion7()}";

            // Debita o valor bruto (amount) do available
            // Credita o valor bruto (amount) no blocked - o total fica bloqueado at� confirma��o/falha
            var entries = new List<LedgerEntry>
            {
                new()
                {
                    LedgerTransactionId = transactionId,
                    AccountId = availableAccount.Id,
                    Type = LedgerEntryType.Debit,
                    Amount = amount,
                    Timestamp = now,
                    Description = $"Saque solicitado"
                },
                new()
                {
                    LedgerTransactionId = transactionId,
                    AccountId = blockedAccount.Id,
                    Type = LedgerEntryType.Credit,
                    Amount = amount,
                    Timestamp = now,
                    Description = $"Saque em processamento"
                }
            };

            var balanceUpdates = new List<(Guid AccountId, long Delta)>
            {
                (availableAccount.Id, -amount),
                (blockedAccount.Id, amount)
            };

            MerchantBalanceDeltas? merchantBalanceDeltas = null;
            if (fee > 0)
            {
                await ledgerRepository.GetOrCreateMerchantBalanceAsync(merchantId, Environment);
                merchantBalanceDeltas = new MerchantBalanceDeltas
                {
                    MerchantId = merchantId,
                    Environment = Environment,
                    LifetimeFeesPaidDelta = fee
                };
            }

            await ledgerRepository.CreateTransactionWithAtomicBalanceUpdateAsync(
                LedgerTransactionOperation.PayOut,
                amount,
                entries,
                balanceUpdates,
                merchantBalanceDeltas,
                payoutId: payoutId);

            var newAvailableBalance = await ledgerRepository.GetAccountBalanceAsync(availableAccount.Id);

            return LedgerTransactionResult.Ok(transactionId, newAvailableBalance);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error recording withdrawal request in ledger: PayoutId={PayoutId}", payoutId);
            return LedgerTransactionResult.Fail("Erro ao registrar saque no ledger.");
        }
    }

    public async Task<LedgerTransactionResult> RecordWithdrawalCompletedAsync(
        Guid merchantId,
        Guid payoutId,
        Guid merchantAcquirerId,
        Guid acquirerId,
        long amount,
        long platformFee,
        long acquirerFee,
        string description)
    {
        try
        {
            if (acquirerId == Guid.Empty)
            {
                return LedgerTransactionResult.Fail("Adquirente inválida para conclusão do saque.");
            }

            var alreadyRecorded = await dbContext.LedgerTransactions
                .AnyAsync(t => t.PayoutId == payoutId
                            && t.Operation == LedgerTransactionOperation.SettlementOut);

            if (alreadyRecorded)
            {
                return LedgerTransactionResult.Ok("already-recorded", 0);
            }

            var blockedAccount = await ledgerRepository.GetOrCreateMerchantBlockedAccountAsync(merchantId, Environment, merchantAcquirerId);
            var merchantPayoutsOutAccount = await ledgerRepository.GetOrCreateMerchantPayoutsOutAccountAsync(merchantId, Environment, merchantAcquirerId);
            var acquirerPayoutsOutAccount = await ledgerRepository.GetOrCreateAcquirerPayoutsOutAccountAsync(acquirerId, Environment);

            var now = DateTime.UtcNow;
            var transactionId = $"tx-{Guid.CreateVersion7()}";

            // amount = valor bruto (Amount do Payout) = total que foi bloqueado
            // platformFee = taxa da plataforma
            // netAmount = valor liquido que o merchant recebe
            var netAmount = FeeCalculator.CalculateNetAmount(amount, platformFee);

            // O valor total que sai da adquirente inclui a taxa cobrada por ela
            // Exemplo: merchant saca R$ 500, taxa da adquirente R$ 1
            // Valor que sai fisicamente da adquirente: R$ 501 (R$ 500 para merchant + R$ 1 de taxa)
            var acquirerTotalOut = netAmount + acquirerFee;

            var entries = new List<LedgerEntry>
            {
                new()
                {
                    LedgerTransactionId = transactionId,
                    AccountId = blockedAccount.Id,
                    Type = LedgerEntryType.Debit,
                    Amount = amount,
                    Timestamp = now,
                    Description = $"Saque conclu�do"
                },
                new()
                {
                    LedgerTransactionId = transactionId,
                    AccountId = merchantPayoutsOutAccount.Id,
                    Type = LedgerEntryType.Credit,
                    Amount = netAmount,
                    Timestamp = now,
                    Description = $"Saque enviado"
                },
                new()
                {
                    LedgerTransactionId = transactionId,
                    AccountId = acquirerPayoutsOutAccount.Id,
                    Type = LedgerEntryType.Credit,
                    Amount = acquirerTotalOut,
                    Timestamp = now,
                    Description = $"Saque processado (valor + taxa adquirente)"
                }
            };

            var balanceUpdates = new List<(Guid AccountId, long Delta)>
            {
                (blockedAccount.Id, -amount),
                (merchantPayoutsOutAccount.Id, netAmount),
                (acquirerPayoutsOutAccount.Id, acquirerTotalOut)
            };

            await ledgerRepository.GetOrCreateMerchantBalanceAsync(merchantId, Environment); // ensures period-reset side effect
            var merchantBalanceDeltas = new MerchantBalanceDeltas
            {
                MerchantId = merchantId,
                Environment = Environment,
                LifetimePayoutsDelta = netAmount
            };

            try
            {
                await ledgerRepository.CreateTransactionWithAtomicBalanceUpdateAsync(
                    LedgerTransactionOperation.SettlementOut,
                    amount,
                    entries,
                    balanceUpdates,
                    merchantBalanceDeltas,
                    payoutId: payoutId);
            }
            catch (DbUpdateException ex) when (IsDuplicatePayoutSettlementOut(ex))
            {
                var currentBlockedBalance = await ledgerRepository.GetAccountBalanceAsync(blockedAccount.Id);
                return LedgerTransactionResult.Ok("already-recorded", currentBlockedBalance);
            }

            var newBlockedBalance = await ledgerRepository.GetAccountBalanceAsync(blockedAccount.Id);

            return LedgerTransactionResult.Ok(transactionId, newBlockedBalance);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error recording withdrawal completion in ledger: PayoutId={PayoutId}", payoutId);
            return LedgerTransactionResult.Fail("Erro ao registrar conclus�o do saque no ledger.");
        }
    }

    private static bool IsDuplicatePayoutSettlementOut(DbUpdateException ex)
    {
        return ex.InnerException is PostgresException
        {
            SqlState: PostgresErrorCodes.UniqueViolation,
            ConstraintName: UniquePayoutSettlementOutConstraint
        };
    }

    public async Task<LedgerTransactionResult> RecordWithdrawalFailedAsync(
        Guid merchantId,
        Guid payoutId,
        Guid merchantAcquirerId,
        long amount,
        long fee,
        string description)
    {
        try
        {
            // Cycle-aware idempotency: a prior PayOut+Failed entry from a previous cycle (e.g. after
            // an admin dev/reprocess rearm) must NOT suppress the current cycle's failure recording.
            // Find the most recent PayOut+Pending (withdrawal requested / rearm) for this payout.
            var lastRequestedAt = await dbContext.LedgerTransactions
                .Where(t => t.PayoutId == payoutId
                         && t.Operation == LedgerTransactionOperation.PayOut
                         && t.Status != LedgerTransactionStatus.Failed)
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => (DateTime?)t.CreatedAt)
                .FirstOrDefaultAsync();

            // Only idempotent if the failure was already recorded in the CURRENT cycle (i.e. after
            // the most recent withdrawal request). If lastRequestedAt is null (no request found at
            // all) fall back to checking any existing failure globally.
            var alreadyRecorded = await dbContext.LedgerTransactions
                .AnyAsync(t => t.PayoutId == payoutId
                            && t.Operation == LedgerTransactionOperation.PayOut
                            && t.Status == LedgerTransactionStatus.Failed
                            && (!lastRequestedAt.HasValue || t.CreatedAt >= lastRequestedAt.Value));

            if (alreadyRecorded)
            {
                return LedgerTransactionResult.Ok("already-recorded", 0);
            }

            var availableAccount = await ledgerRepository.GetOrCreateMerchantAvailableAccountAsync(merchantId, Environment, merchantAcquirerId);
            var blockedAccount = await ledgerRepository.GetOrCreateMerchantBlockedAccountAsync(merchantId, Environment, merchantAcquirerId);

            var blockedBalance = await ledgerRepository.GetAccountBalanceAsync(blockedAccount.Id);
            if (blockedBalance < amount)
            {
                logger.LogError(
                    "Invalid withdrawal failure reversal attempt: insufficient blocked balance. PayoutId={PayoutId}, BlockedBalance={BlockedBalance}, Amount={Amount}",
                    payoutId,
                    blockedBalance,
                    amount);

                return LedgerTransactionResult.Fail(
                    "N�o foi poss�vel reverter o saque: saldo bloqueado insuficiente para devolu��o.");
            }

            var now = DateTime.UtcNow;
            var transactionId = $"tx-{Guid.CreateVersion7()}";

            // amount = valor bruto (Amount do Payout) = total que foi bloqueado
            // fee = taxa da plataforma (apenas para reverter KPI)
            // Devolve o valor total bloqueado para o available
            var entries = new List<LedgerEntry>
            {
                new()
                {
                    LedgerTransactionId = transactionId,
                    AccountId = blockedAccount.Id,
                    Type = LedgerEntryType.Debit,
                    Amount = amount,
                    Timestamp = now,
                    Description = $"Saque falhou - devolu��o"
                },
                new()
                {
                    LedgerTransactionId = transactionId,
                    AccountId = availableAccount.Id,
                    Type = LedgerEntryType.Credit,
                    Amount = amount,
                    Timestamp = now,
                    Description = $"Saque falhou - devolu��o"
                }
            };

            var balanceUpdates = new List<(Guid AccountId, long Delta)>
            {
                (blockedAccount.Id, -amount),
                (availableAccount.Id, amount)
            };

            // Reverte o KPI de taxa paga
            MerchantBalanceDeltas? merchantBalanceDeltas = null;
            if (fee > 0)
            {
                await ledgerRepository.GetOrCreateMerchantBalanceAsync(merchantId, Environment); // ensures period-reset side effect
                merchantBalanceDeltas = new MerchantBalanceDeltas
                {
                    MerchantId = merchantId,
                    Environment = Environment,
                    LifetimeFeesPaidDelta = -fee
                };
            }

            await ledgerRepository.CreateTransactionWithAtomicBalanceUpdateAsync(
                LedgerTransactionOperation.PayOut,
                amount,
                entries,
                balanceUpdates,
                merchantBalanceDeltas,
                payoutId: payoutId,
                status: LedgerTransactionStatus.Failed);

            var newAvailableBalance = await ledgerRepository.GetAccountBalanceAsync(availableAccount.Id);

            return LedgerTransactionResult.Ok(transactionId, newAvailableBalance);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error recording withdrawal failure in ledger: PayoutId={PayoutId}", payoutId);
            return LedgerTransactionResult.Fail("Erro ao registrar falha do saque no ledger.");
        }
    }

    public async Task<LedgerTransactionResult> RecordPlatformWithdrawalRequestedAsync(
        Guid platformPayoutId,
        long amount,
        string description)
    {
        try
        {
            var blockedAccount = await ledgerRepository.GetOrCreatePlatformBlockedAccountAsync(Environment);

            var now = DateTime.UtcNow;
            var transactionId = $"tx-{Guid.CreateVersion7()}";

            var entries = new List<LedgerEntry>
            {
                new()
                {
                    LedgerTransactionId = transactionId,
                    AccountId = blockedAccount.Id,
                    Type = LedgerEntryType.Credit,
                    Amount = amount,
                    Timestamp = now,
                    Description = $"Saque da plataforma em processamento"
                }
            };

            var balanceUpdates = new List<(Guid AccountId, long Delta)>
            {
                (blockedAccount.Id, amount)
            };

            await ledgerRepository.CreateTransactionWithAtomicBalanceUpdateAsync(
                LedgerTransactionOperation.PlatformPayOutRequested,
                amount,
                entries,
                balanceUpdates,
                platformPayoutId: platformPayoutId);

            var newBlockedBalance = await ledgerRepository.GetAccountBalanceAsync(blockedAccount.Id);

            return LedgerTransactionResult.Ok(transactionId, newBlockedBalance);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error recording platform withdrawal request in ledger: PlatformPayoutId={PlatformPayoutId}", platformPayoutId);
            return LedgerTransactionResult.Fail("Erro ao registrar solicita��o de saque da plataforma no ledger.");
        }
    }

    public async Task<LedgerTransactionResult> RecordPlatformWithdrawalCompletedAsync(
        Guid platformPayoutId,
        Guid? platformPayoutItemId,
        Guid acquirerId,
        long amount,
        long acquirerFee,
        string description)
    {
        try
        {
            var alreadyRecorded = platformPayoutItemId.HasValue
                ? await dbContext.LedgerTransactions.IgnoreQueryFilters()
                    .AnyAsync(t => t.PlatformPayoutItemId == platformPayoutItemId.Value
                                && t.Operation == LedgerTransactionOperation.PlatformPayOut)
                : await dbContext.LedgerTransactions.IgnoreQueryFilters()
                    .AnyAsync(t => t.PlatformPayoutId == platformPayoutId
                                && t.PlatformPayoutItemId == null
                                && t.Operation == LedgerTransactionOperation.PlatformPayOut);

            if (alreadyRecorded)
            {
                return LedgerTransactionResult.Ok("already-recorded", 0);
            }

            var blockedAccount = await ledgerRepository.GetOrCreatePlatformBlockedAccountAsync(Environment);
            var payoutsOutAccount = await ledgerRepository.GetOrCreatePlatformPayoutsOutAccountAsync(Environment);
            var acquirerPayoutsOutAccount = await ledgerRepository.GetOrCreateAcquirerPayoutsOutAccountAsync(acquirerId, Environment);

            var netAmount = FeeCalculator.CalculateAcquirerNetAmount(amount, acquirerFee);
            var acquirerTotalOut = amount;
            var now = DateTime.UtcNow;
            var transactionId = $"tx-{Guid.CreateVersion7()}";

            var entries = new List<LedgerEntry>
            {
                new()
                {
                    LedgerTransactionId = transactionId,
                    AccountId = blockedAccount.Id,
                    Type = LedgerEntryType.Debit,
                    Amount = amount,
                    Timestamp = now,
                    Description = $"Saque da plataforma conclu�do"
                },
                new()
                {
                    LedgerTransactionId = transactionId,
                    AccountId = payoutsOutAccount.Id,
                    Type = LedgerEntryType.Credit,
                    Amount = netAmount,
                    Timestamp = now,
                    Description = $"Saque da plataforma realizado (l�quido)"
                },
                new()
                {
                    LedgerTransactionId = transactionId,
                    AccountId = acquirerPayoutsOutAccount.Id,
                    Type = LedgerEntryType.Credit,
                    Amount = acquirerTotalOut,
                    Timestamp = now,
                    Description = $"Saque da plataforma processado (valor total)"
                }
            };

            var balanceUpdates = new List<(Guid AccountId, long Delta)>
            {
                (blockedAccount.Id, -amount),
                (payoutsOutAccount.Id, netAmount),
                (acquirerPayoutsOutAccount.Id, acquirerTotalOut)
            };

            await ledgerRepository.CreateTransactionWithAtomicBalanceUpdateAsync(
                LedgerTransactionOperation.PlatformPayOut,
                amount,
                entries,
                balanceUpdates,
                platformPayoutId: platformPayoutId,
                platformPayoutItemId: platformPayoutItemId);

            var newPayoutsOutBalance = await ledgerRepository.GetAccountBalanceAsync(payoutsOutAccount.Id);

            return LedgerTransactionResult.Ok(transactionId, newPayoutsOutBalance);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error recording platform withdrawal completion in ledger: PlatformPayoutId={PlatformPayoutId}, ItemId={ItemId}", platformPayoutId, platformPayoutItemId);
            return LedgerTransactionResult.Fail("Erro ao registrar conclus�o de saque da plataforma no ledger.");
        }
    }

    public async Task<LedgerTransactionResult> RecordPlatformWithdrawalFailedAsync(
        Guid platformPayoutId,
        Guid? platformPayoutItemId,
        long amount,
        string description)
    {
        try
        {
            // Deduplica��o:
            // - Se platformPayoutItemId � fornecido (falha de item espec�fico): verificar por item
            // - Se platformPayoutItemId � null (rollback do payout inteiro): verificar por payout
            var alreadyRecorded = platformPayoutItemId.HasValue
                ? await dbContext.LedgerTransactions.IgnoreQueryFilters()
                    .AnyAsync(t => t.PlatformPayoutItemId == platformPayoutItemId.Value
                                && t.Status == LedgerTransactionStatus.Failed)
                : await dbContext.LedgerTransactions.IgnoreQueryFilters()
                    .AnyAsync(t => t.PlatformPayoutId == platformPayoutId
                                && t.PlatformPayoutItemId == null
                                && t.Status == LedgerTransactionStatus.Failed);

            if (alreadyRecorded)
                return LedgerTransactionResult.Ok("already-recorded", 0);

            var blockedAccount = await ledgerRepository.GetOrCreatePlatformBlockedAccountAsync(Environment);

            var now = DateTime.UtcNow;
            var transactionId = $"tx-{Guid.CreateVersion7()}";

            var entries = new List<LedgerEntry>
            {
                new()
                {
                    LedgerTransactionId = transactionId,
                    AccountId = blockedAccount.Id,
                    Type = LedgerEntryType.Debit,
                    Amount = amount,
                    Timestamp = now,
                    Description = $"Saque da plataforma falhou"
                }
            };

            var balanceUpdates = new List<(Guid AccountId, long Delta)>
            {
                (blockedAccount.Id, -amount)
            };

            await ledgerRepository.CreateTransactionWithAtomicBalanceUpdateAsync(
                LedgerTransactionOperation.PlatformPayOut,
                amount,
                entries,
                balanceUpdates,
                platformPayoutId: platformPayoutId,
                platformPayoutItemId: platformPayoutItemId,
                status: LedgerTransactionStatus.Failed);

            return LedgerTransactionResult.Ok(transactionId, 0);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error recording platform withdrawal failure in ledger: PlatformPayoutId={PlatformPayoutId}, ItemId={ItemId}", platformPayoutId, platformPayoutItemId);
            return LedgerTransactionResult.Fail("Erro ao registrar falha de saque da plataforma no ledger.");
        }
    }

    public async Task<LedgerTransactionResult> RecordAcquirerAdjustmentAsync(
        Guid acquirerId,
        long amount,
        bool isCredit,
        string reason)
    {
        try
        {
            if (amount <= 0)
                return LedgerTransactionResult.Fail("O valor do ajuste deve ser maior que zero.");

            if (string.IsNullOrWhiteSpace(reason))
                return LedgerTransactionResult.Fail("O motivo do ajuste � obrigat�rio.");

            var settlementAccount = await ledgerRepository.GetOrCreateAcquirerSettlementAccountAsync(acquirerId, Environment);

            var now = DateTime.UtcNow;
            var transactionId = $"tx-{Guid.CreateVersion7()}";

            var entries = new List<LedgerEntry>
            {
                new()
                {
                    LedgerTransactionId = transactionId,
                    AccountId = settlementAccount.Id,
                    Type = isCredit ? LedgerEntryType.Credit : LedgerEntryType.Debit,
                    Amount = amount,
                    Timestamp = now,
                    Description = $"Ajuste de adquirente: {reason}"
                }
            };

            var delta = isCredit ? amount : -amount;
            var balanceUpdates = new List<(Guid AccountId, long Delta)>
            {
                (settlementAccount.Id, delta)
            };

            await ledgerRepository.CreateTransactionWithAtomicBalanceUpdateAsync(
                LedgerTransactionOperation.AcquirerAdjustment,
                amount,
                entries,
                balanceUpdates,
                notes: reason,
                status: LedgerTransactionStatus.Approved);

            var newBalance = await ledgerRepository.GetAccountBalanceAsync(settlementAccount.Id);

            return LedgerTransactionResult.Ok(transactionId, newBalance);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error recording acquirer adjustment in ledger: AcquirerId={AcquirerId}, Amount={Amount}, IsCredit={IsCredit}", acquirerId, amount, isCredit);
            return LedgerTransactionResult.Fail("Erro ao registrar ajuste de adquirente no ledger.");
        }
    }

    public async Task<LedgerTransactionResult> RecordAcquirerSafefyProfitAdjustmentAsync(
        Guid acquirerId,
        long amount,
        bool isCredit,
        string reason)
    {
        try
        {
            if (amount <= 0)
                return LedgerTransactionResult.Fail("O valor do ajuste deve ser maior que zero.");

            if (string.IsNullOrWhiteSpace(reason))
                return LedgerTransactionResult.Fail("O motivo do ajuste � obrigat�rio.");

            var settlementAccount = await ledgerRepository.GetOrCreateAcquirerSettlementAccountAsync(acquirerId, Environment);

            var now = DateTime.UtcNow;
            var transactionId = $"tx-{Guid.CreateVersion7()}";

            var entryType = isCredit ? LedgerEntryType.Credit : LedgerEntryType.Debit;
            var delta = isCredit ? amount : -amount;

            var entries = new List<LedgerEntry>
            {
                new()
                {
                    LedgerTransactionId = transactionId,
                    AccountId = settlementAccount.Id,
                    Type = entryType,
                    Amount = amount,
                    Timestamp = now,
                    Description = $"Ajuste de lucro Safefy na adquirente: {reason}"
                }
            };

            var balanceUpdates = new List<(Guid AccountId, long Delta)>
            {
                (settlementAccount.Id, delta)
            };

            await ledgerRepository.CreateTransactionWithAtomicBalanceUpdateAsync(
                LedgerTransactionOperation.AcquirerSafefyProfitAdjustment,
                amount,
                entries,
                balanceUpdates,
                notes: reason,
                status: LedgerTransactionStatus.Approved);

            var newBalance = await ledgerRepository.GetAccountBalanceAsync(settlementAccount.Id);
            return LedgerTransactionResult.Ok(transactionId, newBalance);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error recording acquirer swiftpay profit adjustment: AcquirerId={AcquirerId}, Amount={Amount}, IsCredit={IsCredit}", acquirerId, amount, isCredit);
            return LedgerTransactionResult.Fail("Erro ao registrar ajuste de lucro Safefy na adquirente no ledger.");
        }
    }

    public async Task<LedgerTransactionResult> RecordMerchantAdjustmentAsync(
        Guid merchantId,
        ApiEnvironment environment,
        long amount,
        bool isCredit,
        string reason,
        Guid? merchantAcquirerId = null)
    {
        try
        {
            if (amount <= 0)
                return LedgerTransactionResult.Fail("O valor do ajuste deve ser maior que zero.");

            if (string.IsNullOrWhiteSpace(reason))
                return LedgerTransactionResult.Fail("O motivo do ajuste � obrigat�rio.");

            var merchantAccount = await ledgerRepository.GetOrCreateMerchantAvailableAccountAsync(merchantId, environment, merchantAcquirerId);

            var now = DateTime.UtcNow;
            var transactionId = $"tx-{Guid.CreateVersion7()}";

            var entries = new List<LedgerEntry>();
            var balanceUpdates = new List<(Guid AccountId, long Delta)>();

            entries.Add(new LedgerEntry
            {
                LedgerTransactionId = transactionId,
                AccountId = merchantAccount.Id,
                Type = isCredit ? LedgerEntryType.Credit : LedgerEntryType.Debit,
                Amount = amount,
                Timestamp = now,
                Description = isCredit
                    ? $"Ajuste de organiza��o (cr�dito): {reason}"
                    : $"Ajuste de organiza��o (d�bito): {reason}"
            });

            balanceUpdates.Add((merchantAccount.Id, isCredit ? amount : -amount));

            await ledgerRepository.CreateTransactionWithAtomicBalanceUpdateAsync(
                LedgerTransactionOperation.MerchantAdjustment,
                amount,
                entries,
                balanceUpdates,
                notes: reason,
                status: LedgerTransactionStatus.Approved);

            var newMerchantBalance = await ledgerRepository.GetAccountBalanceAsync(merchantAccount.Id);
            var newPlatformBalance = await GetTotalAvailableForWithdrawalAsync();

            return LedgerTransactionResult.Ok(transactionId, newMerchantBalance, newPlatformBalance);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error recording merchant adjustment in ledger: MerchantId={MerchantId}, Amount={Amount}, IsCredit={IsCredit}", merchantId, amount, isCredit);
            return LedgerTransactionResult.Fail("Erro ao registrar ajuste de organiza��o no ledger.");
        }
    }

    public Task<LedgerTransactionResult> RecordReferralCommissionPayoutAsync(
        long amount,
        string description)
    {
        if (amount <= 0)
        {
            return Task.FromResult(LedgerTransactionResult.Fail("O valor do pagamento da comiss�o deve ser maior que zero."));
        }

        return Task.FromResult(LedgerTransactionResult.Ok(string.Empty, 0));
    }

    public async Task<long> GetMerchantAvailableBalanceAsync(Guid merchantId)
    {
        var availableBalance = await ledgerRepository.SumMerchantAccountBalanceByTypeAsync(merchantId, AccountType.MerchantAvailable, Environment);
        var lockedAmounts = await GetMerchantCompensationLockedAmountsAsync(merchantId);

        return Math.Max(0, availableBalance - lockedAmounts.Values.Sum());
    }

    public async Task<long> GetMerchantAvailableBalanceAsync(Guid merchantId, Guid merchantAcquirerId)
    {
        var availableBalance = await ledgerRepository.GetMerchantAvailableBalanceByAcquirerAsync(merchantId, merchantAcquirerId, Environment);
        var lockedAmounts = await GetMerchantCompensationLockedAmountsAsync(merchantId);

        return Math.Max(0, availableBalance - lockedAmounts.GetValueOrDefault(merchantAcquirerId));
    }

    public async Task<long> GetMerchantWithdrawNowAvailableBalanceAsync(Guid merchantId)
    {
        var bucketBalances = await ledgerRepository.GetMerchantAvailableAccountBalancesAsync(merchantId, Environment);
        var lockedAmounts = await GetMerchantCompensationLockedAmountsAsync(merchantId);

        foreach (var bucket in bucketBalances)
        {
            if (!bucket.MerchantAcquirerId.HasValue)
            {
                if (bucket.Balance > 0)
                    return bucket.Balance;

                continue;
            }

            var adjustedBalance = Math.Max(0, bucket.Balance - lockedAmounts.GetValueOrDefault(bucket.MerchantAcquirerId.Value));
            if (adjustedBalance > 0)
                return adjustedBalance;
        }

        return 0;
    }

    public async Task<List<MerchantAcquirerBucketBalance>> GetMerchantAcquirerBucketBalancesAsync(Guid merchantId)
    {
        var bucketBalances = await ledgerRepository.GetMerchantAvailableAccountBalancesAsync(merchantId, Environment);
        var lockedAmounts = await GetMerchantCompensationLockedAmountsAsync(merchantId);

        return bucketBalances
            .Select(bucket => new MerchantAcquirerBucketBalance
            {
                MerchantAcquirerId = bucket.MerchantAcquirerId,
                Balance = bucket.MerchantAcquirerId.HasValue
                    ? Math.Max(0, bucket.Balance - lockedAmounts.GetValueOrDefault(bucket.MerchantAcquirerId.Value))
                    : bucket.Balance
            })
            .Where(bucket => bucket.Balance > 0)
            .ToList();
    }

    public async Task<long> GetMerchantPendingBalanceAsync(Guid merchantId)
    {
        var pendingBalance = await ledgerRepository.SumMerchantAccountBalanceByTypeAsync(merchantId, AccountType.MerchantPending, Environment);
        var lockedAmounts = await GetMerchantCompensationLockedAmountsAsync(merchantId);

        return pendingBalance + lockedAmounts.Values.Sum();
    }

    public async Task<long> GetMerchantBlockedBalanceAsync(Guid merchantId)
    {
        return await ledgerRepository.SumMerchantAccountBalanceByTypeAsync(merchantId, AccountType.MerchantBlocked, Environment);
    }

    public async Task<long> GetMerchantReservedBalanceAsync(Guid merchantId)
    {
        return await ledgerRepository.SumMerchantAccountBalanceByTypeAsync(merchantId, AccountType.MerchantReserved, Environment);
    }

    public async Task<MerchantBalanceInfo> GetMerchantBalanceInfoAsync(Guid merchantId)
    {
        var balance = await ledgerRepository.GetOrCreateMerchantBalanceAsync(merchantId, Environment);
        var lastEntries = await ledgerRepository.GetLastTransactionsAsync(merchantId, Environment, 5);

        var available = await GetMerchantAvailableBalanceAsync(merchantId);
        var pending = await GetMerchantPendingBalanceAsync(merchantId);
        var reserved = await GetMerchantReservedBalanceAsync(merchantId);
        var blocked = await GetMerchantBlockedBalanceAsync(merchantId);
        var withdrawNowAvailable = await GetMerchantWithdrawNowAvailableBalanceAsync(merchantId);
        var bucketBalances = await GetMerchantAcquirerBucketBalancesAsync(merchantId);

        return new MerchantBalanceInfo
        {
            MerchantId = merchantId,
            Currency = "BRL",
            Available = available,
            WithdrawNowAvailable = withdrawNowAvailable,
            RequiresFullWithdrawalNow = withdrawNowAvailable > 0 && withdrawNowAvailable < available,
            Pending = pending,
            Reserved = reserved,
            Blocked = blocked,
            Total = available + pending + reserved + blocked,
            LifetimeVolume = balance.LifetimeVolume,
            LifetimePayouts = balance.LifetimePayouts,
            LifetimeRefunds = balance.LifetimeRefunds,
            LifetimeFeesPaid = balance.LifetimeFeesPaid,
            VolumeToday = balance.VolumeToday,
            VolumeThisWeek = balance.VolumeThisWeek,
            VolumeThisMonth = balance.VolumeThisMonth,
            LastTransactions = lastEntries.Select(e => new LedgerEntryInfo
            {
                Id = e.Id,
                Type = e.Type.ToString(),
                Amount = e.Amount,
                Description = e.Description,
                CreatedAt = e.Timestamp
            }).ToList(),
            AcquirerBucketBalances = bucketBalances,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public async Task<Dictionary<Guid, long>> GetMerchantsAvailableBalancesAsync(IEnumerable<Guid> merchantIds)
    {
        var merchantIdsList = merchantIds.ToList();
        if (merchantIdsList.Count == 0)
            return [];

        var balances = await dbContext.Accounts
            .Where(a => a.MerchantId.HasValue 
                && merchantIdsList.Contains(a.MerchantId.Value) 
                && a.Type == AccountType.MerchantAvailable)
            .GroupBy(a => a.MerchantId!.Value)
            .Select(g => new { MerchantId = g.Key, Balance = g.Sum(x => x.Balance) })
            .ToDictionaryAsync(a => a.MerchantId, a => a.Balance);

        return balances;
    }

    public async Task<long> GetTotalAvailableForWithdrawalAsync()
    {
        var acquirers = await dbContext.Acquirers
            .AsNoTracking()
            .Where(a => a.IsActive && a.SupportsWithdrawal)
            .ToListAsync();

        var availableByAcquirer = await calculationService.GetTotalAvailableForWithdrawalByAcquirerAsync(acquirers, Environment);
        return availableByAcquirer.Values.Sum();
    }

    public async Task<long> GetPlatformBlockedBalanceAsync()
    {
        var account = await ledgerRepository.GetOrCreatePlatformBlockedAccountAsync(Environment);
        return await ledgerRepository.GetAccountBalanceAsync(account.Id);
    }

    public async Task<PlatformBalanceInfo> GetPlatformBalanceInfoAsync()
    {
        var blockedAccount = await ledgerRepository.GetOrCreatePlatformBlockedAccountAsync(Environment);
        var payoutsOutAccount = await ledgerRepository.GetOrCreatePlatformPayoutsOutAccountAsync(Environment);

        var available = await GetTotalAvailableForWithdrawalAsync();
        var blocked = await ledgerRepository.GetAccountBalanceAsync(blockedAccount.Id);
        var payoutsOut = await ledgerRepository.GetAccountBalanceAsync(payoutsOutAccount.Id);

        return new PlatformBalanceInfo
        {
            Currency = "BRL",
            Available = available,
            Blocked = blocked,
            Total = available + blocked,
            LifetimePayoutsOut = payoutsOut,
            UpdatedAt = DateTime.UtcNow
        };
    }
}

