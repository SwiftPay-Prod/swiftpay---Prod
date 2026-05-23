using Swiftpay.Domain.Entities;

namespace Swiftpay.Application.Common;

public interface IWithdrawalRepository
{
    Task<Withdrawal?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<List<Withdrawal>> ListByCompanyAsync(Guid companyId, int page, int limit, CancellationToken ct);
    Task AddAsync(Withdrawal withdrawal, CancellationToken ct);
    Task<int> CountByCompanyAsync(Guid companyId, CancellationToken ct);
}
