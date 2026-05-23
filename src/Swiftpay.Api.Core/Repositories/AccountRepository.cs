using Microsoft.EntityFrameworkCore;
using Swiftpay.Application.Common;
using Swiftpay.Domain.Entities;
using Swiftpay.Domain.Enums;
using Swiftpay.Infrastructure.Data;

namespace Swiftpay.Infrastructure.Repositories;

public class AccountRepository : IAccountRepository
{
    private readonly AppDbContext _context;

    public AccountRepository(AppDbContext context) { _context = context; }

    public async Task<Account> GetOrCreateAsync(AccountType type, Guid? merchantId, Guid? acquirerId, Guid? merchantAcquirerId, string environment, CancellationToken ct)
    {
        var account = await _context.Accounts.FirstOrDefaultAsync(a =>
            a.Type == type && a.MerchantId == merchantId && a.Environment == environment && a.MerchantAcquirerId == merchantAcquirerId, ct);
        if (account is not null) return account;

        account = new Account
        {
            Id = Guid.NewGuid(),
            Type = type,
            MerchantId = merchantId,
            AcquirerId = acquirerId,
            MerchantAcquirerId = merchantAcquirerId,
            Environment = environment,
            Balance = 0,
        };
        _context.Accounts.Add(account);
        await _context.SaveChangesAsync(ct);
        return account;
    }

    public async Task<List<Account>> GetMerchantAccountsAsync(Guid merchantId, string environment, CancellationToken ct)
        => await _context.Accounts.Where(a => a.MerchantId == merchantId && a.Environment == environment).ToListAsync(ct);

    public async Task<Account?> GetByIdAsync(Guid accountId, CancellationToken ct)
        => await _context.Accounts.FindAsync(new object[] { accountId }, ct);
}
