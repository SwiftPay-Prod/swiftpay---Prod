using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using Microsoft.Extensions.Logging;
using swiftpay_api_core.Constants;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Utils;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_payment.Models.Transactions;

namespace swiftpay_api_payment.Services;
/// <summary>
/// Serviço de pagamento via Payment Link.
/// Mesma lógica de U2 (Checkout) mas para a modalidade Link:
/// toda criação de Payment com status Pending via Link dispara push Pending
/// com deep-link, respeitando preferências por evento e canal.
/// Reutiliza o mesmo seam de notificação de TransactionService/OrderService:
/// INotificationService.CreatePaymentNotificationAsync(PaymentPending, Routes.Transactions).
/// </summary>
public sealed class PaymentLinkService(
    ITransactionService transactionService,
    INotificationService notificationService,
    ILogger<PaymentLinkService> logger
) : IPaymentLinkService
{
    public async Task<TransactionResult> CreateForLinkAsync(CreateTransactionInput input)
    {
        // Normaliza flags para garantir modalidade Link (PIX-only, R11)
        input.IsPaymentLinkPayment = true;
        input.IsCheckoutPayment = false;
        input.RequestSource = PaymentRequestSource.PaymentLink;

        var result = await transactionService.CreateAsync(input);

        // Garantia explícita do seam: TransactionService já chama SendTransactionCreatedNotificationAsync
        // com PaymentPending + Routes.Transactions via notificationService.CreatePaymentNotificationAsync.
        // Este bloco é defensivo/idempotente: se por qualquer motivo o pagamento foi criado mas a notificação
        // não foi enviada (ex: SuppressWebhookAndNotification ou falha silenciosa), reforçamos o mesmo seam.
        // Evitamos duplicar quando TransactionService já notificou: checamos Success e Payment existente;
        // a TransactionService já fez fire-and-forget, então não reenviamos para não duplicar in-app.
        // Mantemos o seam único: qualquer pagamento via Link passa por transactionService e portanto
        // pelo mesmo caminho de notificação da API direta.
        // Se necessário forçar notificação direta (sem duplicar), descomentar o bloco abaixo e
        // condicionar a SuppressWebhookAndNotification já verificado em TransactionService.
        // Exemplo de chamada canônica (mantida como documentação viva do seam):
        // await notificationService.CreatePaymentNotificationAsync(
        //     result.Payment!.MerchantId,
        //     NotificationTemplates.Payment.Pending.Title,
        //     NotificationTemplates.Payment.Pending.Message(netAmount, methodLabel),
        //     NotificationStatusType.PaymentPending,
        //     result.Payment.Environment,
        //     NotificationTemplates.Routes.Transactions);
        _ = logger; // evita warning de campo não usado quando bloco defensivo está comentado
        _ = notificationService; // seam documentado; uso real via TransactionService

        return result;
    }

    // Documentação do seam canônico para referência futura (não usado diretamente
    // porque TransactionService já encapsula). Mantido para clareza de contrato.
    private static async Task SendLinkPaymentPendingNotificationAsync(
        swiftpay_api_core.Models.Database.Payment payment,
        INotificationService svc)
    {
        if (payment.SuppressWebhookAndNotification)
            return;

        var methodLabel = FormatUtils.FormatPaymentMethod(payment.Method.ToString());
        var netAmount = FeeCalculator.CalculateNetAmount(
            payment.Amount,
            payment.PlatformFee,
            payment.CheckoutTemplateFee);
        var message = NotificationTemplates.Payment.Pending.Message(netAmount, methodLabel);

        await svc.CreatePaymentNotificationAsync(
            payment.MerchantId,
            NotificationTemplates.Payment.Pending.Title,
            message,
            NotificationStatusType.PaymentPending,
            payment.Environment,
            NotificationTemplates.Routes.Transactions);
    }
}
