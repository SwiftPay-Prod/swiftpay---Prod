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
    private const int MaxRetries = 3;

    public LedgerRepository(AppDbContext context) { _context = context; }

    public async Task<LedgerTransactionResult> CreateTransactionWithAtomicBalanceUpdateAsync(
        LedgerTransaction transaction, List<(Account account, long delta)> balanceUpdates, CancellationToken ct)
    {
        var strategy = _context.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync(async () =>
        {
            for (int attempt = 1; attempt <= MaxRetries; attempt++)
            {
                await using var dbTransaction = await _context.Database.BeginTransactionAsync(ct);
                try
                {
                    foreach (var (account, delta) in balanceUpdates)
                    {
                        var rowsAffected = await _context.Database.ExecuteSqlRawAsync(
                            "UPDATE \"Accounts\" SET \"Balance\" = \"Balance\" + @delta, \"UpdatedAt\" = NOW() WHERE \"Id\" = @id AND \"RowVersion\" = @rowVersion",
                            new Npgsql.NpgsqlParameter("delta", delta),
                            new Npgsql.NpgsqlParameter("id", account.Id),
                            new Npgsql.NpgsqlParameter("rowVersion", account.RowVersion));

                        if (rowsAffected == 0)
                            throw new DbUpdateConcurrencyException($"Concurrency conflict on account {account.Id}. Retry attempt {attempt}/{MaxRetries}.");
                    }

                    _context.LedgerTransactions.Add(transaction);
                    await _context.SaveChangesAsync(ct);
                    await dbTransaction.CommitAsync(ct);

                    var updated = balanceUpdates.Count > 0
                        ? await _context.Accounts.AsNoTracking().FirstOrDefaultAsync(a => a.Id == balanceUpdates[0].account.Id, ct)
                        : null;

                    return LedgerTransactionResult.Ok(transaction.Id, updated?.Balance ?? 0);
                }
                catch (DbUpdateConcurrencyException) when (attempt < MaxRetries)
                {
                    await dbTransaction.RollbackAsync(ct);
                    var delay = TimeSpan.FromMilliseconds(Math.Pow(2, attempt) * 100);
                    await Task.Delay(delay, ct);

                    // Reload accounts with fresh RowVersion
                    for (int i = 0; i < balanceUpdates.Count; i++)
                    {
                        var fresh = await _context.Accounts.AsNoTracking()
                            .FirstOrDefaultAsync(a => a.Id == balanceUpdates[i].account.Id, ct);
                        if (fresh != null)
                            balanceUpdates[i] = (fresh, balanceUpdates[i].delta);
                    }
                }
                catch (Exception ex)
                {
                    await dbTransaction.RollbackAsync(ct);
                    if (attempt < MaxRetries)
                    {
                        var delay = TimeSpan.FromMilliseconds(Math.Pow(2, attempt) * 100);
                        await Task.Delay(delay, ct);
                    }
                    else
                    {
                        return LedgerTransactionResult.Fail($"Concurrency failure after {MaxRetries} attempts: {ex.Message}");
                    }
                }
            }

            return LedgerTransactionResult.Fail($"Concurrency failure after {MaxRetries} attempts");
        });
    }

    public async Task<LedgerTransaction?> GetTransactionByIdAsync(string transactionId, CancellationToken ct)
        => await _context.LedgerTransactions.Include(t => t.Entries).FirstOrDefaultAsync(t => t.Id == transactionId, ct);

    public async Task<List<LedgerTransaction>> GetTransactionsByPaymentIdAsync(Guid paymentId, CancellationToken ct)
        => await _context.LedgerTransactions.Include(t => t.Entries).Where(t => t.PaymentId == paymentId).ToListAsync(ct);

    public async Task<bool> TransactionExistsAsync(Guid paymentId, LedgerOperation operation, string status, CancellationToken ct)
        => await _context.LedgerTransactions.AnyAsync(t => t.PaymentId == paymentId && t.Operation == operation && t.Status == status, ct);
}
