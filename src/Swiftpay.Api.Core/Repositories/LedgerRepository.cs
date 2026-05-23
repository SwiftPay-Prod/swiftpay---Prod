using Microsoft.EntityFrameworkCore;
using Swiftpay.Application.Common;
using Swiftpay.Domain.Entities;
using Swiftpay.Domain.Enums;
using Swiftpay.Domain.ValueObjects;
using Swiftpay.Infrastructure.Data;

namespace Swiftpay.Infrastructure.Repositories;

public class LedgerRepository : ILedgerRepository
{
    private readonly AppDbContext _context;

    public LedgerRepository(AppDbContext context) { _context = context; }

    public async Task<LedgerTransactionResult> CreateTransactionWithAtomicBalanceUpdateAsync(
        LedgerTransaction transaction, List<(Account account, long delta)> balanceUpdates, CancellationToken ct)
    {
        var strategy = _context.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var dbTransaction = await _context.Database.BeginTransactionAsync(ct);
            try
            {
                foreach (var (account, delta) in balanceUpdates)
                {
                    await _context.Database.ExecuteSqlRawAsync(
                        "UPDATE \"Accounts\" SET \"Balance\" = \"Balance\" + @delta, \"UpdatedAt\" = NOW() WHERE \"Id\" = @id",
                        new Npgsql.NpgsqlParameter("delta", delta),
                        new Npgsql.NpgsqlParameter("id", account.Id));
                }

                _context.LedgerTransactions.Add(transaction);
                await _context.SaveChangesAsync(ct);
                await dbTransaction.CommitAsync(ct);

                Account? updated = null;
                if (balanceUpdates.Count > 0)
                {
                    updated = await _context.Accounts.FindAsync(new object[] { balanceUpdates[0].account.Id }, ct);
                }

                return LedgerTransactionResult.Ok(transaction.Id, updated?.Balance ?? 0);
            }
            catch (Exception ex)
            {
                await dbTransaction.RollbackAsync(ct);
                return LedgerTransactionResult.Fail(ex.Message);
            }
        });
    }

    public async Task<LedgerTransaction?> GetTransactionByIdAsync(string transactionId, CancellationToken ct)
        => await _context.LedgerTransactions.Include(t => t.Entries).FirstOrDefaultAsync(t => t.Id == transactionId, ct);

    public async Task<List<LedgerTransaction>> GetTransactionsByPaymentIdAsync(Guid paymentId, CancellationToken ct)
        => await _context.LedgerTransactions.Include(t => t.Entries).Where(t => t.PaymentId == paymentId).ToListAsync(ct);

    public async Task<bool> TransactionExistsAsync(Guid paymentId, LedgerOperation operation, string status, CancellationToken ct)
        => await _context.LedgerTransactions.AnyAsync(t => t.PaymentId == paymentId && t.Operation == operation && t.Status == status, ct);
}
