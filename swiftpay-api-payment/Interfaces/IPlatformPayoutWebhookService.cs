using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api_payment.Interfaces;

public interface IPlatformPayoutWebhookService
{
    /// <summary>
    /// Tenta processar o webhook de uma adquirente como um item de saque da plataforma.
    /// Retorna true se o item foi encontrado e processado, false caso contrário.
    /// </summary>
    Task<bool> TryProcessWebhookAsync(
        AcquirerType acquirerType,
        string txId,
        PayoutStatus status,
        string? endToEndId,
        string? acquirerTransactionId,
        string? rejectReason,
        CancellationToken ct = default);
}
