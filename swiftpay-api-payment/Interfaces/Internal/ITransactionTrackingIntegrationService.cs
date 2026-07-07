using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_payment.Interfaces.Internal;

public interface ITransactionTrackingIntegrationService
{
    Task NotifyPaymentStatusAsync(
        Guid paymentId,
        Guid merchantId,
        PaymentStatus status,
        ApiEnvironment environment,
        CancellationToken ct = default);
}
