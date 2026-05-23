using Swiftpay.Domain.Entities;

namespace Swiftpay.Api.Core.Common;

public interface IPaymentRepository
{
    Task AddAsync(Payment payment, CancellationToken ct);
    Task<Payment?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<Payment?> GetByExternalIdAsync(string externalId, CancellationToken ct);
}
