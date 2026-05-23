using Microsoft.EntityFrameworkCore;
using Swiftpay.Application.Common;
using Swiftpay.Domain.Entities;
using Swiftpay.Infrastructure.Data;

namespace Swiftpay.Infrastructure.Repositories;

public class PaymentLinkRepository : IPaymentLinkRepository
{
    private readonly AppDbContext _context;

    public PaymentLinkRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PaymentLink?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        return await _context.PaymentLinks.FirstOrDefaultAsync(x => x.Id == id, ct);
    }

    public async Task<List<PaymentLink>> ListByCompanyAsync(Guid companyId, int page, int limit, CancellationToken ct)
    {
        return await _context.PaymentLinks
            .Where(x => x.CompanyId == companyId)
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync(ct);
    }

    public async Task<int> CountByCompanyAsync(Guid companyId, CancellationToken ct)
    {
        return await _context.PaymentLinks.CountAsync(x => x.CompanyId == companyId, ct);
    }

    public async Task AddAsync(PaymentLink link, CancellationToken ct)
    {
        await _context.PaymentLinks.AddAsync(link, ct);
    }

    public void Update(PaymentLink link)
    {
        _context.PaymentLinks.Update(link);
    }

    public void Delete(PaymentLink link)
    {
        _context.PaymentLinks.Remove(link);
    }
}
