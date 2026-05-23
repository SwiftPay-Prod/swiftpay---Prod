using Swiftpay.Domain.Entities;

namespace Swiftpay.Application.Common;

public interface IPaymentLinkRepository
{
    Task<PaymentLink?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<List<PaymentLink>> ListByCompanyAsync(Guid companyId, int page, int limit, CancellationToken ct);
    Task<int> CountByCompanyAsync(Guid companyId, CancellationToken ct);
    Task AddAsync(PaymentLink link, CancellationToken ct);
    void Update(PaymentLink link);
    void Delete(PaymentLink link);
}
