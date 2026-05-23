using Microsoft.EntityFrameworkCore;
using Swiftpay.Application.Common;
using Swiftpay.Domain.Entities;
using Swiftpay.Infrastructure.Data;

namespace Swiftpay.Infrastructure.Repositories;

public class CompanyRepository : ICompanyRepository
{
    private readonly AppDbContext _context;

    public CompanyRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Company?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        return await _context.Companies.FirstOrDefaultAsync(c => c.Id == id, ct);
    }

    public async Task<Company?> GetByDocumentAsync(string document, CancellationToken ct)
    {
        return await _context.Companies.FirstOrDefaultAsync(c => c.Document == document, ct);
    }

    public async Task AddAsync(Company company, CancellationToken ct)
    {
        await _context.Companies.AddAsync(company, ct);
    }

    public void Update(Company company)
    {
        _context.Companies.Update(company);
    }
}
