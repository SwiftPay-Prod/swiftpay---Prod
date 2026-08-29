using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Constants;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Mappers;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Models.MassTransit;
using swiftpay_api_core.Models.Messages;
using swiftpay_api_payment.Constants;
using swiftpay_api_payment.Hubs;
using swiftpay_api_payment.Models.SignalR;
using PaymentSignalRMethods = swiftpay_api_payment.Constants.SignalRMethods;

namespace swiftpay_api_payment.Services.Sandbox;

public class SandboxService(
    PrimaryDbContext dbContext,
    ILedgerService ledgerService,
    IStockService stockService,
    IMessagePublisher messagePublisher,
    IHubContext<PaymentStatusHub> paymentHubContext,
    ILogger<SandboxService> logger
) : ISandboxService
{
    private static readonly string[] SandboxPayerNames =
    [
        "João Silva Sandbox",
        "Maria Santos Teste",
        "Carlos Oliveira Dev",
        "Ana Costa QA",
        "Pedro Souza Homolog"
    ];

    private static readonly string[] SandboxBankNames =
    [
        "Banco Sandbox",
        "Banco Teste",
        "Banco Desenvolvimento",
        "Banco QA",
        "Banco Homologação"
    ];

    private static readonly string[] SandboxDocuments =
    [
        "12345678900",
        "98765432100",
        "11122233344",
        "55566677788",
        "99988877766"
    ];

    public SandboxPixData GenerateSandboxPixData(long amount, string? description, int expirationMinutes)
    {
        var paymentId = Guid.CreateVersion7().ToString("N")[..16];
        var txId = $"SANDBOX{paymentId}";
        var expiresAt = DateTime.UtcNow.AddMinutes(expirationMinutes);

        // Gerar EMV QR Code simulado (não é um código válido real)
        var emvQrCode = GenerateSandboxEmvQrCode(amount, txId);

        return new SandboxPixData
        {
            TxId = txId,
            QrCode = $"data:image/png;base64,{GenerateSandboxQrCodeBase64(txId)}",
            CopyAndPaste = emvQrCode,
            ExpiresAt = expiresAt
        };
    }

    public SandboxPayerData GenerateSandboxPayerData()
    {
        var random = new Random();
        var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
        var randomSuffix = random.Next(100000, 999999);

        return new SandboxPayerData
        {
            EndToEndId = $"E00000000{timestamp}SANDBOX{randomSuffix}",
            PayerName = SandboxPayerNames[random.Next(SandboxPayerNames.Length)],
            PayerDocument = SandboxDocuments[random.Next(SandboxDocuments.Length)],
            PayerBank = SandboxBankNames[random.Next(SandboxBankNames.Length)]
        };
    }

    public SandboxPayoutData GenerateSandboxPayoutData(long amount, string pixKey, string? pixKeyType)
    {
        var random = new Random();
        var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
        var randomSuffix = random.Next(100000, 999999);

        return new SandboxPayoutData
        {
            AcquirerTransactionId = $"SANDBOX_PAYOUT_{Guid.CreateVersion7():N}"[..32],
            EndToEndId = $"E00000000{timestamp}SNDPAYOUT{randomSuffix}"
        };
    }

    public async Task<SandboxSimulationResult> SimulatePaymentAsync(
        Payment payment,
        SimulateAction action,
        CancellationToken ct = default)
    {
        if (payment.Environment != ApiEnvironment.Sandbox)
        {
            return SandboxSimulationResult.Fail(
                "Simulação disponível apenas em ambiente Sandbox.",
                "sandbox_only",
                400);
        }

        try
        {
            switch (action)
            {
                case SimulateAction.Complete:
                    return await SimulatePaymentCompleteAsync(payment, ct);
                
                case SimulateAction.Expire:
                    return await SimulatePaymentExpireAsync(payment, ct);
                
                case SimulateAction.Fail:
                    return await SimulatePaymentFailAsync(payment, ct);
                
                case SimulateAction.Refund:
                    return await SimulatePaymentRefundAsync(payment, ct);
                
                default:
                    return SandboxSimulationResult.Fail($"Ação '{action}' não suportada.", "invalid_action");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error simulating payment {PaymentId} with action {Action}", payment.Id, action);
            return SandboxSimulationResult.Fail("Erro interno ao simular pagamento.", "internal_error", 500);
        }
    }

    public async Task<SandboxSimulationResult> SimulateCashoutAsync(
        Payout payout,
        SimulateCashoutAction action,
        CancellationToken ct = default)
    {
        if (payout.Environment != ApiEnvironment.Sandbox)
        {
            return SandboxSimulationResult.Fail(
                "Simulação disponível apenas em ambiente Sandbox.",
                "sandbox_only",
                400);
        }

        try
        {
            switch (action)
            {
                case SimulateCashoutAction.Complete:
                    return await SimulateCashoutCompleteAsync(payout, ct);
                
                case SimulateCashoutAction.Fail:
                    return await SimulateCashoutFailAsync(payout, "Falha simulada no processamento.", ct);
                
                case SimulateCashoutAction.Reject:
                    return await SimulateCashoutRejectAsync(payout, "Saque rejeitado (simulação).", ct);
                
                default:
                    return SandboxSimulationResult.Fail($"Ação '{action}' não suportada.", "invalid_action");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error simulating cashout {PayoutId} with action {Action}", payout.Id, action);
            return SandboxSimulationResult.Fail("Erro interno ao simular saque.", "internal_error", 500);
        }
    }

    #region Payment Simulation

    private async Task<SandboxSimulationResult> SimulatePaymentCompleteAsync(Payment payment, CancellationToken ct)
    {
        if (payment.Status != PaymentStatus.Pending)
        {
            return SandboxSimulationResult.Fail(
                $"Não é possível completar um pagamento com status '{payment.Status}'.",
                "invalid_status");
        }

        var payerData = GenerateSandboxPayerData();

        payment.Status = PaymentStatus.Completed;
        payment.CompletedAt = DateTime.UtcNow;

        if (payment.PaymentPix != null)
        {
            payment.PaymentPix.EndToEndId = payerData.EndToEndId;
            payment.PaymentPix.PayerName = payerData.PayerName;
            payment.PaymentPix.PayerDocument = payerData.PayerDocument;
            payment.PaymentPix.PayerBank = payerData.PayerBank;
        }

        await dbContext.SaveChangesAsync(ct);

        // Registrar no Ledger
        await ledgerService.RecordPaymentReceivedAsync(
            payment.MerchantId,
            payment.MerchantAcquirerId,
            payment.Id,
            payment.AcquirerId,
            payment.Amount,
            payment.PlatformFee + payment.CheckoutTemplateFee,
            payment.AcquirerFee,
            payment.MerchantSettlementAmount,
            $"[SANDBOX] Pagamento recebido - {payment.Description}");

        await messagePublisher.PublishAsync(
            RabbitMQQueues.PaymentCompleted,
            payment.ToCompletedMessage(PaymentStatus.Pending, "sandbox.complete", PaymentFeeSplitHandling.None));
        if (!string.IsNullOrEmpty(payment.CallbackUrl))
        {
            await messagePublisher.PublishAsync(
                RabbitMQQueues.SendWebhook,
                new SendWebhookMessage
                {
                    PaymentId = payment.Id,
                    EventType = "payment.completed"
                });
        }

        // Enviar notificação
        await messagePublisher.PublishAsync(
            RabbitMQQueues.NotificationCreated,
            new NotificationCreatedMessage(
                NotificationId: Guid.CreateVersion7(),
                Scope: NotificationScope.Merchant,
                MerchantId: payment.MerchantId,
                UserId: null,
                Environment: payment.Environment,
                Type: NotificationType.Success,
                StatusType: NotificationStatusType.PaymentCompleted,
                Priority: NotificationPriority.Normal,
                Title: NotificationTemplates.Payment.Completed.Title,
                Message: NotificationTemplates.Payment.Completed.Message(payment.NetAmount),
                ActionUrl: NotificationTemplates.Routes.Transactions,
                ActionLabel: NotificationTemplates.DefaultActionLabel,
                IsRead: false,
                ReadAt: null,
                CreatedAt: DateTime.UtcNow));

        // Notificar checkout via SignalR
        await NotifyPaymentStatusChangedAsync(payment.Id, payment.Status, ct);

        // Update order status and confirm stock if this payment is linked to an order
        if (payment.OrderId.HasValue)
        {
            // Confirm stock reservation
            await stockService.ConfirmReservationAsync(payment.OrderId.Value);

            // Update order status to Confirmed (payment received)
            var order = await dbContext.Orders.OrderBy(o => o.Id).FirstOrDefaultAsync(o => o.Id == payment.OrderId.Value, ct);
            if (order != null && (order.Status == OrderStatus.Reserved || order.Status == OrderStatus.Pending))
            {
                order.Status = OrderStatus.Confirmed;
                order.UpdatedAt = DateTime.UtcNow;
                await dbContext.SaveChangesAsync(ct);
            }

            // Get customer info for digital delivery
            string? customerEmail = null;
            string? customerName = null;

            if (order?.CustomerId != null)
            {
                var customer = await dbContext.Customers
                    .Where(c => c.Id == order.CustomerId)
                    .OrderBy(c => c.Id)
                    .Select(c => new { c.Email, c.Name })
                    .FirstOrDefaultAsync(ct);

                customerEmail = customer?.Email;
                customerName = customer?.Name;
            }

            await messagePublisher.PublishAsync(
                RabbitMQQueues.ProcessDigitalDelivery,
                new ProcessDigitalDeliveryMessage
                {
                    OrderId = payment.OrderId.Value,
                    PaymentId = payment.Id,
                    MerchantId = payment.MerchantId,
                    Environment = payment.Environment.ToString(),
                    CustomerId = order?.CustomerId,
                    CustomerEmail = customerEmail,
                    CustomerName = customerName
                });
        }

        return SandboxSimulationResult.Ok();
    }

    private async Task<SandboxSimulationResult> SimulatePaymentExpireAsync(Payment payment, CancellationToken ct)
    {
        if (payment.Status != PaymentStatus.Pending)
        {
            return SandboxSimulationResult.Fail(
                $"Não é possível expirar um pagamento com status '{payment.Status}'.",
                "invalid_status");
        }

        payment.Status = PaymentStatus.Expired;
        payment.FailureReason = "[SANDBOX] Pagamento expirado (simulação)";

        await dbContext.SaveChangesAsync(ct);

        // Release stock and update order status if applicable
        if (payment.OrderId.HasValue)
        {
            await stockService.ReleaseReservationAsync(payment.OrderId.Value);
            await stockService.ReleaseDigitalItemsAsync(payment.OrderId.Value);

            var order = await dbContext.Orders.OrderBy(o => o.Id).FirstOrDefaultAsync(o => o.Id == payment.OrderId.Value, ct);
            if (order != null && order.Status == OrderStatus.Reserved)
            {
                order.Status = OrderStatus.Cancelled;
                order.UpdatedAt = DateTime.UtcNow;
                await dbContext.SaveChangesAsync(ct);
            }
        }

        // Remover do ledger pendente
        await ledgerService.RecordPaymentCancelledAsync(
            payment.MerchantId,
            payment.MerchantAcquirerId,
            payment.Id,
            payment.Amount,
            payment.PlatformFee + payment.CheckoutTemplateFee,
            "[SANDBOX] Pagamento expirado",
            payment.MerchantSettlementAmount);

        // Enviar notificação
        await messagePublisher.PublishAsync(
            RabbitMQQueues.NotificationCreated,
            new NotificationCreatedMessage(
                NotificationId: Guid.CreateVersion7(),
                Scope: NotificationScope.Merchant,
                MerchantId: payment.MerchantId,
                UserId: null,
                Environment: payment.Environment,
                Type: NotificationType.Warning,
                StatusType: NotificationStatusType.PaymentExpired,
                Priority: NotificationPriority.Normal,
                Title: NotificationTemplates.Payment.Expired.Title,
                Message: NotificationTemplates.Payment.Expired.Message(payment.NetAmount),
                ActionUrl: NotificationTemplates.Routes.Transactions,
                ActionLabel: NotificationTemplates.DefaultActionLabel,
                IsRead: false,
                ReadAt: null,
                CreatedAt: DateTime.UtcNow));

        // Notificar checkout via SignalR
        await NotifyPaymentStatusChangedAsync(payment.Id, payment.Status, ct);

        return SandboxSimulationResult.Ok();
    }

    private async Task<SandboxSimulationResult> SimulatePaymentFailAsync(Payment payment, CancellationToken ct)
    {
        if (payment.Status != PaymentStatus.Pending)
        {
            return SandboxSimulationResult.Fail(
                $"Não é possível falhar um pagamento com status '{payment.Status}'.",
                "invalid_status");
        }

        payment.Status = PaymentStatus.Failed;
        payment.FailureReason = "[SANDBOX] Falha no processamento (simulação)";

        await dbContext.SaveChangesAsync(ct);

        // Release stock and update order status if applicable
        if (payment.OrderId.HasValue)
        {
            await stockService.ReleaseReservationAsync(payment.OrderId.Value);
            await stockService.ReleaseDigitalItemsAsync(payment.OrderId.Value);

            var order = await dbContext.Orders.OrderBy(o => o.Id).FirstOrDefaultAsync(o => o.Id == payment.OrderId.Value, ct);
            if (order != null && order.Status == OrderStatus.Reserved)
            {
                order.Status = OrderStatus.Cancelled;
                order.UpdatedAt = DateTime.UtcNow;
                await dbContext.SaveChangesAsync(ct);
            }
        }

        // Remover do ledger pendente
        await ledgerService.RecordPaymentCancelledAsync(
            payment.MerchantId,
            payment.MerchantAcquirerId,
            payment.Id,
            payment.Amount,
            payment.PlatformFee + payment.CheckoutTemplateFee,
            "[SANDBOX] Pagamento falhou",
            payment.MerchantSettlementAmount);

        // Enviar notificação
        await messagePublisher.PublishAsync(
            RabbitMQQueues.NotificationCreated,
            new NotificationCreatedMessage(
                NotificationId: Guid.CreateVersion7(),
                Scope: NotificationScope.Merchant,
                MerchantId: payment.MerchantId,
                UserId: null,
                Environment: payment.Environment,
                Type: NotificationType.Error,
                StatusType: NotificationStatusType.PaymentFailed,
                Priority: NotificationPriority.Normal,
                Title: NotificationTemplates.Payment.Failed.Title,
                Message: NotificationTemplates.Payment.Failed.Message(payment.NetAmount),
                ActionUrl: NotificationTemplates.Routes.Transactions,
                ActionLabel: NotificationTemplates.DefaultActionLabel,
                IsRead: false,
                ReadAt: null,
                CreatedAt: DateTime.UtcNow));

        // Notificar checkout via SignalR
        await NotifyPaymentStatusChangedAsync(payment.Id, payment.Status, ct);

        return SandboxSimulationResult.Ok();
    }

    private async Task<SandboxSimulationResult> SimulatePaymentRefundAsync(Payment payment, CancellationToken ct)
    {
        if (payment.Status != PaymentStatus.Completed)
        {
            return SandboxSimulationResult.Fail(
                "Só é possível estornar pagamentos concluídos.",
                "invalid_status");
        }

        payment.Status = PaymentStatus.Refunded;
        payment.RefundedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(ct);

        // Registrar estorno no ledger
        await ledgerService.RecordPaymentRefundedAsync(
            payment.MerchantId,
            payment.MerchantAcquirerId,
            payment.Id,
            payment.AcquirerId,
            payment.Amount,
            payment.PlatformFee + payment.CheckoutTemplateFee,
            payment.AcquirerFee,
            payment.MerchantSettlementAmount,
            "[SANDBOX] Pagamento estornado");

        // Enviar webhook se configurado
        if (!string.IsNullOrEmpty(payment.CallbackUrl))
        {
            await messagePublisher.PublishAsync(
                RabbitMQQueues.SendWebhook,
                new SendWebhookMessage
                {
                    PaymentId = payment.Id,
                    EventType = "payment.refunded"
                });
        }

        // Enviar notificação
        await messagePublisher.PublishAsync(
            RabbitMQQueues.NotificationCreated,
            new NotificationCreatedMessage(
                NotificationId: Guid.CreateVersion7(),
                Scope: NotificationScope.Merchant,
                MerchantId: payment.MerchantId,
                UserId: null,
                Environment: payment.Environment,
                Type: NotificationType.Warning,
                StatusType: NotificationStatusType.PaymentRefunded,
                Priority: NotificationPriority.Normal,
                Title: NotificationTemplates.Payment.Refunded.Title,
                Message: NotificationTemplates.Payment.Refunded.Message(payment.NetAmount),
                ActionUrl: NotificationTemplates.Routes.Transactions,
                ActionLabel: NotificationTemplates.DefaultActionLabel,
                IsRead: false,
                ReadAt: null,
                CreatedAt: DateTime.UtcNow));

        // Notificar checkout via SignalR
        await NotifyPaymentStatusChangedAsync(payment.Id, payment.Status, ct);

        return SandboxSimulationResult.Ok();
    }

    private async Task NotifyPaymentStatusChangedAsync(Guid paymentId, PaymentStatus status, CancellationToken ct)
    {
        await paymentHubContext.Clients
            .Group($"payment_{paymentId}")
            .SendAsync(
                PaymentSignalRMethods.PaymentStatusChanged,
                new PaymentStatusChangedPayload
                {
                    PaymentId = paymentId,
                    Status = status
                },
                ct);
    }

    #endregion

    #region Cashout Simulation

    private async Task<SandboxSimulationResult> SimulateCashoutCompleteAsync(Payout payout, CancellationToken ct)
    {
        if (payout.Status != PayoutStatus.Pending && payout.Status != PayoutStatus.Processing)
        {
            return SandboxSimulationResult.Fail(
                $"Não é possível completar um saque com status '{payout.Status}'.",
                "invalid_status");
        }

        // Carregar a conta de saque para gerar dados simulados
        var payoutAccount = await dbContext.MerchantPayoutAccounts
            .OrderBy(a => a.Id)
            .FirstOrDefaultAsync(a => a.Id == payout.MerchantPayoutAccountId, ct);

        var sandboxData = GenerateSandboxPayoutData(
            payout.Amount,
            payoutAccount?.PixKey ?? "sandbox_key",
            payoutAccount?.PixKeyType.ToString());

        payout.Status = PayoutStatus.Completed;
        payout.CompletedAt = DateTime.UtcNow;
        payout.ProcessedAt = DateTime.UtcNow;
        payout.AcquirerTransactionId = sandboxData.AcquirerTransactionId;
        payout.PixEndToEndId = sandboxData.EndToEndId;
        payout.AcquirerStatus = "COMPLETED";

        await dbContext.SaveChangesAsync(ct);

        var acquirerId = payout.MerchantAcquirer?.AcquirerId ?? Guid.Empty;
        if (acquirerId == Guid.Empty)
        {
            return SandboxSimulationResult.Fail(
                "Adquirente não encontrada para concluir o saque em sandbox.",
                "acquirer_not_found");
        }

        // Registrar no ledger (confirmar o saque)
        await ledgerService.RecordWithdrawalCompletedAsync(
            payout.MerchantId,
            payout.Id,
            payout.MerchantAcquirerId,
            acquirerId,
            payout.Amount,
            payout.PlatformFee,
            payout.AcquirerFee,
            $"[SANDBOX] Saque confirmado - E2E: {sandboxData.EndToEndId}");

        // Enviar notificação
        await messagePublisher.PublishAsync(
            RabbitMQQueues.NotificationCreated,
            new NotificationCreatedMessage(
                NotificationId: Guid.CreateVersion7(),
                Scope: NotificationScope.Merchant,
                MerchantId: payout.MerchantId,
                UserId: null,
                Environment: payout.Environment,
                Type: NotificationType.Success,
                StatusType: NotificationStatusType.PayoutCompleted,
                Priority: NotificationPriority.Normal,
                Title: NotificationTemplates.Payout.Completed.Title,
                Message: NotificationTemplates.Payout.Completed.Message(payout.NetAmount),
                ActionUrl: NotificationTemplates.Routes.Cashouts,
                ActionLabel: NotificationTemplates.DefaultActionLabel,
                IsRead: false,
                ReadAt: null,
                CreatedAt: DateTime.UtcNow));

            if (!string.IsNullOrWhiteSpace(payout.CallbackUrl))
            {
                await messagePublisher.PublishAsync(
                RabbitMQQueues.SendCashoutWebhook,
                payout.ToWebhookMessage(WebhookEvents.Cashout.Completed));
            }

        return SandboxSimulationResult.Ok();
    }

    private async Task<SandboxSimulationResult> SimulateCashoutFailAsync(Payout payout, string reason, CancellationToken ct)
    {
        if (payout.Status != PayoutStatus.Pending && payout.Status != PayoutStatus.Processing)
        {
            return SandboxSimulationResult.Fail(
                $"Não é possível falhar um saque com status '{payout.Status}'.",
                "invalid_status");
        }

        payout.Status = PayoutStatus.Failed;
        payout.FailureReason = $"[SANDBOX] {reason}";
        payout.ProcessedAt = DateTime.UtcNow;
        payout.AcquirerStatus = "FAILED";

        await dbContext.SaveChangesAsync(ct);

        // Devolver valor ao saldo disponível
        await ledgerService.RecordWithdrawalFailedAsync(
            payout.MerchantId,
            payout.Id,
            payout.MerchantAcquirerId,
            payout.Amount,
            payout.PlatformFee,
            $"[SANDBOX] {reason}");

        // Enviar notificação
        await messagePublisher.PublishAsync(
            RabbitMQQueues.NotificationCreated,
            new NotificationCreatedMessage(
                NotificationId: Guid.CreateVersion7(),
                Scope: NotificationScope.Merchant,
                MerchantId: payout.MerchantId,
                UserId: null,
                Environment: payout.Environment,
                Type: NotificationType.Error,
                StatusType: NotificationStatusType.PayoutFailed,
                Priority: NotificationPriority.Normal,
                Title: NotificationTemplates.Payout.Failed.Title,
                Message: NotificationTemplates.Payout.Failed.Message(payout.NetAmount),
                ActionUrl: NotificationTemplates.Routes.Cashouts,
                ActionLabel: NotificationTemplates.DefaultActionLabel,
                IsRead: false,
                ReadAt: null,
                CreatedAt: DateTime.UtcNow));

            if (!string.IsNullOrWhiteSpace(payout.CallbackUrl))
            {
                await messagePublisher.PublishAsync(
                RabbitMQQueues.SendCashoutWebhook,
                payout.ToWebhookMessage(WebhookEvents.Cashout.Failed));
            }

        return SandboxSimulationResult.Ok();
    }

    private async Task<SandboxSimulationResult> SimulateCashoutRejectAsync(Payout payout, string reason, CancellationToken ct)
    {
        if (payout.Status != PayoutStatus.Pending && payout.Status != PayoutStatus.Processing)
        {
            return SandboxSimulationResult.Fail(
                $"Não é possível rejeitar um saque com status '{payout.Status}'.",
                "invalid_status");
        }

        payout.Status = PayoutStatus.Rejected;
        payout.FailureReason = $"[SANDBOX] {reason}";
        payout.ProcessedAt = DateTime.UtcNow;
        payout.AcquirerStatus = "REJECTED";

        await dbContext.SaveChangesAsync(ct);

        // Devolver valor ao saldo disponível
        await ledgerService.RecordWithdrawalFailedAsync(
            payout.MerchantId,
            payout.Id,
            payout.MerchantAcquirerId,
            payout.Amount,
            payout.PlatformFee,
            $"[SANDBOX] {reason}");

        // Enviar notificação
        await messagePublisher.PublishAsync(
            RabbitMQQueues.NotificationCreated,
            new NotificationCreatedMessage(
                NotificationId: Guid.CreateVersion7(),
                Scope: NotificationScope.Merchant,
                MerchantId: payout.MerchantId,
                UserId: null,
                Environment: payout.Environment,
                Type: NotificationType.Warning,
                StatusType: NotificationStatusType.PayoutRejected,
                Priority: NotificationPriority.Normal,
                Title: NotificationTemplates.Payout.Rejected.Title,
                Message: NotificationTemplates.Payout.Rejected.Message(payout.NetAmount),
                ActionUrl: NotificationTemplates.Routes.Cashouts,
                ActionLabel: NotificationTemplates.DefaultActionLabel,
                IsRead: false,
                ReadAt: null,
                CreatedAt: DateTime.UtcNow));

            if (!string.IsNullOrWhiteSpace(payout.CallbackUrl))
            {
                await messagePublisher.PublishAsync(
                RabbitMQQueues.SendCashoutWebhook,
                payout.ToWebhookMessage(WebhookEvents.Cashout.Rejected));
            }

        return SandboxSimulationResult.Ok();
    }

    #endregion

    #region Helpers

    private static string GenerateSandboxEmvQrCode(long amount, string txId)
    {
        // Gerar um EMV QR Code simulado (não é válido para pagamento real)
        var amountStr = (amount / 100.0).ToString("F2").Replace(",", ".");
        return $"00020126580014br.gov.bcb.pix0136sandbox-{txId}5204000053039865406{amountStr}5802BR5925SAFEFY SANDBOX TEST6009SAO PAULO62070503***6304XXXX";
    }

    private static string GenerateSandboxQrCodeBase64(string txId)
    {
        // Retornar um placeholder base64 para o QR Code
        // Em produção, isso seria uma imagem real gerada pela adquirente
        return "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    }

    #endregion
}
