using Swiftpay.Domain.Entities;
using Swiftpay.Domain.Enums;

namespace Swiftpay.Application.Common;

public interface IAccountRepository
{
    Task<Account> GetOrCreateAsync(AccountType type, Guid? merchantId, Guid? acquirerId, Guid? merchantAcquirerId, string environment, CancellationToken ct);
    Task<List<Account>> GetMerchantAccountsAsync(Guid merchantId, string environment, CancellationToken ct);
    Task<Account?> GetByIdAsync(Guid accountId, CancellationToken ct);
}
