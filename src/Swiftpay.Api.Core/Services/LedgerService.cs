using Swiftpay.Application.Common;
using Swiftpay.Domain.Entities;
using Swiftpay.Domain.Enums;
using Swiftpay.Domain.ValueObjects;

namespace Swiftpay.Application.Services;

public class LedgerService : ILedgerService
{
    private readonly IAccountRepository _accountRepo;
    private readonly ILedgerRepository _ledgerRepo;

    public LedgerService(IAccountRepository accountRepo, ILedgerRepository ledgerRepo)
    {
        _accountRepo = accountRepo;
        _ledgerRepo = ledgerRepo;
    }

    public async Task<LedgerTransactionResult> RecordPaymentPendingAsync(
        Guid paymentId, Guid merchantId, Guid? merchantAcquirerId, long amount, string environment, CancellationToken ct)
    {
        if (await _ledgerRepo.TransactionExistsAsync(paymentId, LedgerOperation.PixIn, "Pending", ct))
            return LedgerTransactionResult.Ok("already-recorded", 0);

        var pendingAccount = await _accountRepo.GetOrCreateAsync(
            AccountType.MerchantPending, merchantId, null, merchantAcquirerId, environment, ct);

        var transaction = new LedgerTransaction
        {
            Id = $"tx-{Guid.NewGuid()}", Amount = amount, Operation = LedgerOperation.PixIn,
            Status = "Pending", PaymentId = paymentId, CreatedAt = DateTime.UtcNow,
        };
        transaction.Entries.Add(new LedgerEntry
        {
            Id = $"e-{Guid.NewGuid()}", AccountId = pendingAccount.Id,
            Type = LedgerEntryType.Credit, Amount = amount, Timestamp = DateTime.UtcNow,
        });

        return await _ledgerRepo.CreateTransactionWithAtomicBalanceUpdateAsync(
            transaction, new List<(Account, long)> { (pendingAccount, amount) }, ct);
    }

    public async Task<LedgerTransactionResult> RecordPaymentReceivedAsync(
        Guid paymentId, Guid merchantId, Guid? merchantAcquirerId,
        long amount, long settlementAmount, long acquirerFee, string environment, CancellationToken ct)
    {
        if (await _ledgerRepo.TransactionExistsAsync(paymentId, LedgerOperation.PixIn, "Approved", ct))
            return LedgerTransactionResult.Ok("already-recorded", 0);

        var pendingAccount = await _accountRepo.GetOrCreateAsync(
            AccountType.MerchantPending, merchantId, null, merchantAcquirerId, environment, ct);
        var availableAccount = await _accountRepo.GetOrCreateAsync(
            AccountType.MerchantAvailable, merchantId, null, merchantAcquirerId, environment, ct);
        var settlementAcct = await _accountRepo.GetOrCreateAsync(
            AccountType.AcquirerSettlement, null, merchantAcquirerId, null, environment, ct);

        var reserveAmount = amount - settlementAmount;
        var tx = new LedgerTransaction
        {
            Id = $"tx-{Guid.NewGuid()}", Amount = amount, Operation = LedgerOperation.PixIn,
            Status = "Approved", PaymentId = paymentId, CreatedAt = DateTime.UtcNow,
        };
        tx.Entries = new List<LedgerEntry>
        {
            new() { Id = $"e-{Guid.NewGuid()}", AccountId = pendingAccount.Id, Type = LedgerEntryType.Debit, Amount = amount, Description = "Release pending", Timestamp = DateTime.UtcNow },
            new() { Id = $"e-{Guid.NewGuid()}", AccountId = availableAccount.Id, Type = LedgerEntryType.Credit, Amount = settlementAmount, Description = "Settlement", Timestamp = DateTime.UtcNow },
            new() { Id = $"e-{Guid.NewGuid()}", AccountId = settlementAcct.Id, Type = LedgerEntryType.Credit, Amount = acquirerFee, Description = "Acquirer fee", Timestamp = DateTime.UtcNow },
        };

        var updates = new List<(Account, long)>
        {
            (pendingAccount, -amount), (availableAccount, settlementAmount), (settlementAcct, acquirerFee),
        };

        if (reserveAmount > 0)
        {
            var reservedAccount = await _accountRepo.GetOrCreateAsync(
                AccountType.MerchantReserved, merchantId, null, merchantAcquirerId, environment, ct);
            tx.Entries.Add(new() { Id = $"e-{Guid.NewGuid()}", AccountId = reservedAccount.Id, Type = LedgerEntryType.Credit, Amount = reserveAmount, Description = "Reserve", Timestamp = DateTime.UtcNow });
            updates.Add((reservedAccount, reserveAmount));
        }

        return await _ledgerRepo.CreateTransactionWithAtomicBalanceUpdateAsync(tx, updates, ct);
    }

    public async Task<LedgerTransactionResult> RecordPaymentCancelledAsync(
        Guid paymentId, Guid merchantId, Guid? merchantAcquirerId, long amount, string environment, CancellationToken ct)
    {
        if (await _ledgerRepo.TransactionExistsAsync(paymentId, LedgerOperation.PixIn, "Refused", ct))
            return LedgerTransactionResult.Ok("already-recorded", 0);

        var pendingAccount = await _accountRepo.GetOrCreateAsync(
            AccountType.MerchantPending, merchantId, null, merchantAcquirerId, environment, ct);

        var tx = new LedgerTransaction
        {
            Id = $"tx-{Guid.NewGuid()}", Amount = amount, Operation = LedgerOperation.PixIn,
            Status = "Refused", PaymentId = paymentId, Notes = "Payment cancelled", CreatedAt = DateTime.UtcNow,
        };
        tx.Entries.Add(new() { Id = $"e-{Guid.NewGuid()}", AccountId = pendingAccount.Id, Type = LedgerEntryType.Debit, Amount = amount, Description = "Cancel", Timestamp = DateTime.UtcNow });

        return await _ledgerRepo.CreateTransactionWithAtomicBalanceUpdateAsync(tx, new List<(Account, long)> { (pendingAccount, -amount) }, ct);
    }

    public async Task<LedgerTransactionResult> RecordPaymentRefundedAsync(
        Guid paymentId, Guid merchantId, Guid? merchantAcquirerId, long refundAmount, string environment, CancellationToken ct)
    {
        if (await _ledgerRepo.TransactionExistsAsync(paymentId, LedgerOperation.PixRefund, "Approved", ct))
            return LedgerTransactionResult.Ok("already-recorded", 0);

        var availableAccount = await _accountRepo.GetOrCreateAsync(
            AccountType.MerchantAvailable, merchantId, null, merchantAcquirerId, environment, ct);

        var tx = new LedgerTransaction
        {
            Id = $"tx-{Guid.NewGuid()}", Amount = refundAmount, Operation = LedgerOperation.PixRefund,
            Status = "Approved", PaymentId = paymentId, CreatedAt = DateTime.UtcNow,
        };
        tx.Entries.Add(new() { Id = $"e-{Guid.NewGuid()}", AccountId = availableAccount.Id, Type = LedgerEntryType.Debit, Amount = refundAmount, Description = "Refund", Timestamp = DateTime.UtcNow });

        return await _ledgerRepo.CreateTransactionWithAtomicBalanceUpdateAsync(tx, new List<(Account, long)> { (availableAccount, -refundAmount) }, ct);
    }

    public async Task<LedgerTransactionResult> RecordWithdrawalRequestedAsync(Withdrawal withdrawal, CancellationToken ct)
    {
        var availableAccount = await _accountRepo.GetOrCreateAsync(
            AccountType.MerchantAvailable, withdrawal.CompanyId, null, null, "production", ct);
        var blockedAccount = await _accountRepo.GetOrCreateAsync(
            AccountType.MerchantBlocked, withdrawal.CompanyId, null, null, "production", ct);

        var tx = new LedgerTransaction
        {
            Id = $"tx-{Guid.NewGuid()}", Amount = withdrawal.Amount.AmountInCents,
            Operation = LedgerOperation.PayOut, Status = "Pending",
            PayoutId = withdrawal.Id, CreatedAt = DateTime.UtcNow,
        };
        tx.Entries.Add(new() { Id = $"e-{Guid.NewGuid()}", AccountId = availableAccount.Id, Type = LedgerEntryType.Debit, Amount = withdrawal.Amount.AmountInCents, Description = "Withdrawal request", Timestamp = DateTime.UtcNow });
        tx.Entries.Add(new() { Id = $"e-{Guid.NewGuid()}", AccountId = blockedAccount.Id, Type = LedgerEntryType.Credit, Amount = withdrawal.Amount.AmountInCents, Description = "Locked", Timestamp = DateTime.UtcNow });

        return await _ledgerRepo.CreateTransactionWithAtomicBalanceUpdateAsync(tx,
            new List<(Account, long)> { (availableAccount, -withdrawal.Amount.AmountInCents), (blockedAccount, withdrawal.Amount.AmountInCents) }, ct);
    }

    public async Task<LedgerTransactionResult> RecordWithdrawalCompletedAsync(Withdrawal withdrawal, long netAmount, CancellationToken ct)
    {
        var blockedAccount = await _accountRepo.GetOrCreateAsync(
            AccountType.MerchantBlocked, withdrawal.CompanyId, null, null, "production", ct);
        var payoutsAccount = await _accountRepo.GetOrCreateAsync(
            AccountType.MerchantPayoutsOut, withdrawal.CompanyId, null, null, "production", ct);

        var tx = new LedgerTransaction
        {
            Id = $"tx-{Guid.NewGuid()}", Amount = netAmount,
            Operation = LedgerOperation.SettlementOut, Status = "Approved",
            PayoutId = withdrawal.Id, CreatedAt = DateTime.UtcNow,
        };
        tx.Entries.Add(new() { Id = $"e-{Guid.NewGuid()}", AccountId = blockedAccount.Id, Type = LedgerEntryType.Debit, Amount = withdrawal.Amount.AmountInCents, Description = "Release", Timestamp = DateTime.UtcNow });
        tx.Entries.Add(new() { Id = $"e-{Guid.NewGuid()}", AccountId = payoutsAccount.Id, Type = LedgerEntryType.Credit, Amount = netAmount, Description = "Payout", Timestamp = DateTime.UtcNow });

        return await _ledgerRepo.CreateTransactionWithAtomicBalanceUpdateAsync(tx,
            new List<(Account, long)> { (blockedAccount, -withdrawal.Amount.AmountInCents), (payoutsAccount, netAmount) }, ct);
    }

    public async Task<LedgerTransactionResult> RecordWithdrawalFailedAsync(Withdrawal withdrawal, CancellationToken ct)
    {
        var blockedAccount = await _accountRepo.GetOrCreateAsync(
            AccountType.MerchantBlocked, withdrawal.CompanyId, null, null, "production", ct);
        var availableAccount = await _accountRepo.GetOrCreateAsync(
            AccountType.MerchantAvailable, withdrawal.CompanyId, null, null, "production", ct);

        var tx = new LedgerTransaction
        {
            Id = $"tx-{Guid.NewGuid()}", Amount = withdrawal.Amount.AmountInCents,
            Operation = LedgerOperation.PayOut, Status = "Failed",
            PayoutId = withdrawal.Id, Notes = "Withdrawal failed — reversed", CreatedAt = DateTime.UtcNow,
        };
        tx.Entries.Add(new() { Id = $"e-{Guid.NewGuid()}", AccountId = blockedAccount.Id, Type = LedgerEntryType.Debit, Amount = withdrawal.Amount.AmountInCents, Description = "Release (failure)", Timestamp = DateTime.UtcNow });
        tx.Entries.Add(new() { Id = $"e-{Guid.NewGuid()}", AccountId = availableAccount.Id, Type = LedgerEntryType.Credit, Amount = withdrawal.Amount.AmountInCents, Description = "Restore (failure)", Timestamp = DateTime.UtcNow });

        return await _ledgerRepo.CreateTransactionWithAtomicBalanceUpdateAsync(tx,
            new List<(Account, long)> { (blockedAccount, -withdrawal.Amount.AmountInCents), (availableAccount, withdrawal.Amount.AmountInCents) }, ct);
    }

    public async Task<long> GetMerchantAvailableBalanceAsync(Guid merchantId, string environment, CancellationToken ct)
    {
        var accounts = await _accountRepo.GetMerchantAccountsAsync(merchantId, environment, ct);
        return accounts.Where(a => a.Type == AccountType.MerchantAvailable).Sum(a => a.Balance);
    }

    public async Task<long> GetMerchantPendingBalanceAsync(Guid merchantId, string environment, CancellationToken ct)
    {
        var accounts = await _accountRepo.GetMerchantAccountsAsync(merchantId, environment, ct);
        return accounts.Where(a => a.Type == AccountType.MerchantPending).Sum(a => a.Balance);
    }
}
