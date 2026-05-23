using Swiftpay.Domain.Entities;
using Swiftpay.Domain.Enums;
using Swiftpay.Domain.ValueObjects;

namespace Swiftpay.Application.Common;

public interface ILedgerRepository
{
    Task<LedgerTransactionResult> CreateTransactionWithAtomicBalanceUpdateAsync(
        LedgerTransaction transaction,
        List<(Account account, long delta)> balanceUpdates,
        CancellationToken ct);
    Task<LedgerTransaction?> GetTransactionByIdAsync(string transactionId, CancellationToken ct);
    Task<List<LedgerTransaction>> GetTransactionsByPaymentIdAsync(Guid paymentId, CancellationToken ct);
    Task<bool> TransactionExistsAsync(Guid paymentId, LedgerOperation operation, string status, CancellationToken ct);
}
