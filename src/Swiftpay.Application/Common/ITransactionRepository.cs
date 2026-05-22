using Swiftpay.Domain.Entities;

namespace Swiftpay.Application.Common;

public interface ITransactionRepository
{
    Task<Transaction?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<List<Transaction>> ListByCompanyAsync(Guid companyId, int page, int limit, CancellationToken ct);
    Task<int> CountByCompanyAsync(Guid companyId, CancellationToken ct);
    Task AddAsync(Transaction transaction, CancellationToken ct);
}
