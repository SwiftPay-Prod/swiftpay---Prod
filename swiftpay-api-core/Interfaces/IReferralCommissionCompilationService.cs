using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Interfaces;

public interface IReferralCommissionCompilationService
{
    Task EnsureReferralLinkStructuresAsync(Guid referrerUserId, Guid referredUserId, CancellationToken ct = default);

    Task ResetReferralCompilationForReferredUserAsync(
        Guid oldReferrerUserId,
        Guid referredUserId,
        CancellationToken ct = default);

    Task RegisterPaymentCompletedMovementAsync(
        Guid paymentId,
        Guid merchantId,
        long sourceAmount,
        ApiEnvironment environment,
        DateTime occurredAt,
        CancellationToken ct = default);

    Task RegisterPayoutCompletedMovementAsync(
        Guid payoutId,
        Guid merchantId,
        long sourceAmount,
        ApiEnvironment environment,
        DateTime occurredAt,
        CancellationToken ct = default);
}
