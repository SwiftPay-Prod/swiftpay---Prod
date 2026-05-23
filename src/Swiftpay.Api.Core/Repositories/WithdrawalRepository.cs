using Microsoft.EntityFrameworkCore;
using Swiftpay.Application.Common;
using Swiftpay.Domain.Entities;
using Swiftpay.Infrastructure.Data;

namespace Swiftpay.Infrastructure.Repositories;

public class WithdrawalRepository : IWithdrawalRepository
{
    private readonly AppDbContext _context;

    public WithdrawalRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Withdrawal?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        return await _context.Withdrawals.FirstOrDefaultAsync(w => w.Id == id, ct);
    }

    public async Task<List<Withdrawal>> ListByCompanyAsync(Guid companyId, int page, int limit, CancellationToken ct)
    {
        return await _context.Withdrawals
            .Where(w => w.CompanyId == companyId)
            .OrderByDescending(w => w.RequestedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync(ct);
    }

    public async Task AddAsync(Withdrawal withdrawal, CancellationToken ct)
    {
        await _context.Withdrawals.AddAsync(withdrawal, ct);
    }

    public async Task<int> CountByCompanyAsync(Guid companyId, CancellationToken ct)
    {
        return await _context.Withdrawals.CountAsync(w => w.CompanyId == companyId, ct);
    }
}
