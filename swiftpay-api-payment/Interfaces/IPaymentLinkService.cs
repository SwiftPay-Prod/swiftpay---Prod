using swiftpay_api_payment.Models.Transactions;

namespace swiftpay_api_payment.Interfaces;

/// <summary>
/// Seam dedicado para criação de pagamento via Payment Link.
/// Garante que o mesmo seam de notificação de PaymentPending + actionUrl usado pela API direta
/// seja reutilizado para a modalidade Link (PIX-only, R11).
/// </summary>
public interface IPaymentLinkService
{
    /// <summary>
    /// Cria um pagamento originado por um Payment Link.
    /// Deve chamar o mesmo seam de notificação que a criação via API direta:
    /// INotificationService.CreatePaymentNotificationAsync com NotificationStatusType.PaymentPending e actionUrl.
    /// </summary>
    Task<TransactionResult> CreateForLinkAsync(CreateTransactionInput input);
}
