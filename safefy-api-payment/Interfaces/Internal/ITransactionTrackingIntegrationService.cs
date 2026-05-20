using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api_payment.Interfaces.Internal;

public interface ITransactionTrackingIntegrationService
{
    Task NotifyPaymentStatusAsync(
        Guid paymentId,
        Guid merchantId,
        PaymentStatus status,
        ApiEnvironment environment,
        CancellationToken ct = default);
}
