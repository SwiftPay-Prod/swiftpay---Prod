using Microsoft.EntityFrameworkCore;
using Swiftpay.Application.Common;
using Swiftpay.Domain.Entities;
using Swiftpay.Infrastructure.Data;

namespace Swiftpay.Infrastructure.Repositories;

public class TransactionRepository : ITransactionRepository
{
    private readonly AppDbContext _context;

    public TransactionRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Transaction?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        return await _context.Transactions.FirstOrDefaultAsync(t => t.Id == id, ct);
    }

    public async Task<List<Transaction>> ListByCompanyAsync(Guid companyId, int page, int limit, CancellationToken ct)
    {
        return await _context.Transactions
            .Where(t => t.CompanyId == companyId)
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync(ct);
    }

    public async Task<int> CountByCompanyAsync(Guid companyId, CancellationToken ct)
    {
        return await _context.Transactions.CountAsync(t => t.CompanyId == companyId, ct);
    }

    public async Task AddAsync(Transaction transaction, CancellationToken ct)
    {
        await _context.Transactions.AddAsync(transaction, ct);
    }
}
