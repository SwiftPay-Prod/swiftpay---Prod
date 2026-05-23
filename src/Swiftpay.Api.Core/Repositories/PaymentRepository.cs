using Microsoft.EntityFrameworkCore;
using Swiftpay.Api.Core.Common;
using Swiftpay.Domain.Entities;
using Swiftpay.Infrastructure.Data;

namespace Swiftpay.Api.Core.Repositories;

public class PaymentRepository : IPaymentRepository
{
    private readonly AppDbContext _context;

    public PaymentRepository(AppDbContext context) { _context = context; }

    public async Task AddAsync(Payment payment, CancellationToken ct) => await _context.Payments.AddAsync(payment, ct);

    public async Task<Payment?> GetByIdAsync(Guid id, CancellationToken ct) => await _context.Payments.Include(p => p.Pix).FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task<Payment?> GetByExternalIdAsync(string externalId, CancellationToken ct) => await _context.Payments.Include(p => p.Pix).FirstOrDefaultAsync(p => p.ExternalId == externalId, ct);
}
