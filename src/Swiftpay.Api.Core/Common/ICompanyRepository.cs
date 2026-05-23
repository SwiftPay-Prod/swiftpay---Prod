using Swiftpay.Domain.Entities;

namespace Swiftpay.Application.Common;

public interface ICompanyRepository
{
    Task<Company?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<Company?> GetByDocumentAsync(string document, CancellationToken ct);
    Task AddAsync(Company company, CancellationToken ct);
    void Update(Company company);
}
