using swiftpay_api_core.Models.Email;

namespace swiftpay_api_core.Interfaces;

public interface IEmailTerminalSummaryStore
{
    Task<bool> PersistAsync(
        Guid intentId,
        EmailDeliveryTerminalStatus status,
        string? safeErrorCode,
        DateTime occurredAtUtc,
        DateTime? providerAcceptedAtUtc,
        DateTime recordedAtUtc,
        CancellationToken cancellationToken = default);
}
