using MassTransit;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PaymentSignalRMethods = safefy_api_payment.Constants.SignalRMethods;
using safefy_api_payment.Hubs;
using safefy_api_payment.Models.SignalR;
using safefy_api_core.Constants;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Mappers;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_core.Models.MassTransit;
using safefy_api_core.Models.Messages;
using safefy_api_core.Services;
using safefy_api_core.Utils;
using safefy_api_payment.Interfaces.Internal;

namespace safefy_api_payment.Consumers;

public sealed class PaymentCompletedConsumer(
    IServiceScopeFactory scopeFactory,
    ILogger<PaymentCompletedConsumer> logger
) : IConsumer<PaymentCompletedMessage>
{
    public async Task Consume(ConsumeContext<PaymentCompletedMessage> context)
    {
        var message = context.Message;

        try
        {
            using var environmentScope = HybridEnvironmentProvider.SetEnvironment(message.Environment);
            using var scope = scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();
            var ledgerService = scope.ServiceProvider.GetRequiredService<ILedgerService>();
            var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
            var messagePublisher = scope.ServiceProvider.GetRequiredService<IMessagePublisher>();
            var hubContext = scope.ServiceProvider.GetRequiredService<IHubContext<PaymentStatusHub>>();
            var stockService = scope.ServiceProvider.GetRequiredService<IStockService>();
            var referralCommissionCompilationService = scope.ServiceProvider.GetRequiredService<IReferralCommissionCompilationService>();
            var achievementService = scope.ServiceProvider.GetRequiredService<IAchievementService>();
            var wayneProtocolService = scope.ServiceProvider.GetRequiredService<IWayneProtocolService>();
            var transactionTrackingIntegrationService = scope.ServiceProvider.GetRequiredService<ITransactionTrackingIntegrationService>();

            var isWayneProtocol = false;

            switch (message.NewStatus)
            {
                case PaymentStatus.Completed:
                    isWayneProtocol = await ProcessCompletedAsync(message, dbContext, ledgerService, notificationService, messagePublisher, stockService, referralCommissionCompilationService, achievementService, wayneProtocolService);
                    break;
                    
                case PaymentStatus.Expired:
                    await ProcessExpiredAsync(message, dbContext, ledgerService, notificationService, stockService);
                    break;
                    
                case PaymentStatus.Failed:
                    await ProcessFailedAsync(message, dbContext, ledgerService, notificationService, stockService);
                    break;

                case PaymentStatus.Cancelled:
                    await ProcessCancelledAsync(message, dbContext, ledgerService, notificationService, stockService);
                    break;

                case PaymentStatus.Refunded:
                    await ProcessRefundedAsync(message, ledgerService, notificationService);
                    break;

                case PaymentStatus.PartiallyRefunded:
                    await ProcessPartiallyRefundedAsync(message, ledgerService, notificationService);
                    break;
            }

            await transactionTrackingIntegrationService.NotifyPaymentStatusAsync(
                message.PaymentId,
                message.MerchantId,
                message.NewStatus,
                message.Environment,
                context.CancellationToken);

            if (!message.SuppressWebhookAndNotification && !isWayneProtocol && !string.IsNullOrEmpty(message.CallbackUrl))
            {
                await messagePublisher.PublishAsync(
                    RabbitMQQueues.SendWebhook,
                    message.ToWebhookMessage());
            }

            if (!message.SuppressWebhookAndNotification)
            {
                await hubContext.Clients
                    .Group($"payment_{message.PaymentId}")
                    .SendAsync(PaymentSignalRMethods.PaymentStatusChanged, new PaymentStatusChangedPayload
                    {
                        PaymentId = message.PaymentId,
                        Status = message.NewStatus
                    });
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Error processing PaymentCompletedMessage: PaymentId={PaymentId}, Status={Status}",
                message.PaymentId, message.NewStatus);
            throw;
        }
    }

    private async Task<bool> ProcessCompletedAsync(
        PaymentCompletedMessage message,
        PrimaryDbContext dbContext,
        ILedgerService ledgerService,
        INotificationService notificationService,
        IMessagePublisher messagePublisher,
        IStockService stockService,
        IReferralCommissionCompilationService referralCommissionCompilationService,
        IAchievementService achievementService,
        IWayneProtocolService wayneProtocolService)
    {
        var isWayneProtocol = false;
        Payment? waynePayment = null;
        var wayneDecision = await wayneProtocolService.EvaluateAsync(message.Environment);
        if (wayneDecision.Apply)
        {
            isWayneProtocol = true;
            waynePayment = await dbContext.Payments.OrderBy(p => p.Id).FirstOrDefaultAsync(p => p.Id == message.PaymentId);
            if (waynePayment != null)
            {
                waynePayment.IsWayneProtocol = true;
                waynePayment.InternalProtocolCode = WayneProtocolConstants.CreateInternalProtocolCode(
                    message.PlatformFee,
                    message.Amount - message.PlatformFee);
                waynePayment.PlatformFee = message.Amount;
                waynePayment.NetAmount = 0;
                waynePayment.MerchantSettlementAmount = 0;
                waynePayment.WayneCycleNumber = wayneDecision.CycleNumber;
                waynePayment.WayneCyclePosition = wayneDecision.PositionInCycle;
            }
        }

        var effectivePlatformFee = isWayneProtocol ? message.Amount : message.PlatformFee;
        var ledgerResult = await ledgerService.RecordPaymentReceivedAsync(
            message.MerchantId,
            message.MerchantAcquirerId,
            message.PaymentId,
            message.AcquirerId,
            message.Amount,
            effectivePlatformFee,
            message.AcquirerFee,
            isWayneProtocol ? 0 : message.MerchantSettlementAmount,
            $"PIX recebido - TxId: {message.TxId}",
            message.FeeSplitHandling,
            isWayneProtocol);

        if (!ledgerResult.Success)
        {
            logger.LogError(
                "Failed to record payment in ledger: PaymentId={PaymentId}, Error={Error}",
                message.PaymentId, ledgerResult.ErrorMessage);
            throw new InvalidOperationException(
                $"Failed to record completed payment {message.PaymentId} in ledger: {ledgerResult.ErrorMessage}");
        }

        if (waynePayment != null)
        {
            await dbContext.SaveChangesAsync();
        }

        if (!isWayneProtocol)
        {
            await referralCommissionCompilationService.RegisterPaymentCompletedMovementAsync(
                message.PaymentId,
                message.MerchantId,
                message.PlatformFee - message.AcquirerFee,
                message.Environment,
                DateTime.UtcNow);
        }

        if (message.OrderId.HasValue)
        {
            await stockService.ConfirmReservationAsync(message.OrderId.Value);

            var order = await dbContext.Orders
                .OrderBy(o => o.Id)
                .FirstOrDefaultAsync(o => o.Id == message.OrderId.Value);

            if (order != null && (order.Status == OrderStatus.Reserved || order.Status == OrderStatus.Pending))
            {
                order.Status = OrderStatus.Confirmed;
                order.UpdatedAt = DateTime.UtcNow;
                await dbContext.SaveChangesAsync();
            }
        }

        if (!message.SuppressWebhookAndNotification && !isWayneProtocol)
        {
            var netAmount = message.Amount - message.PlatformFee;
            var fullMessage = NotificationTemplates.Payment.Completed.Message(netAmount);

            await notificationService.CreatePaymentNotificationAsync(
                message.MerchantId,
                NotificationTemplates.Payment.Completed.Title,
                fullMessage,
                NotificationStatusType.PaymentCompleted,
                message.Environment,
                NotificationTemplates.Routes.Transactions);

            await SendCustomerEmailsAsync(message, dbContext, messagePublisher);
        }

        var userId = await dbContext.Merchants
            .IgnoreQueryFilters()
            .Where(m => m.Id == message.MerchantId)
            .OrderBy(m => m.Id)
            .Select(m => m.UserId)
            .FirstOrDefaultAsync();

        if (userId != Guid.Empty && !message.SuppressWebhookAndNotification && !isWayneProtocol)
            await achievementService.CheckAndAwardAsync(userId, message.Environment);

        return isWayneProtocol;
    }

    private async Task SendCustomerEmailsAsync(
        PaymentCompletedMessage message,
        PrimaryDbContext dbContext,
        IMessagePublisher messagePublisher)
    {
        string? customerEmail = null;
        string? customerName = null;
        Guid? customerId = null;

        if (message.OrderId.HasValue)
        {
            var orderCustomer = await dbContext.Orders
                .Include(o => o.Customer)
                .Where(o => o.Id == message.OrderId.Value)
                .OrderBy(o => o.Id)
                .Select(o => new { o.CustomerId, CustomerEmail = o.Customer!.Email, CustomerName = o.Customer!.Name })
                .FirstOrDefaultAsync();

            if (orderCustomer != null)
            {
                customerId = orderCustomer.CustomerId;
                customerEmail = orderCustomer.CustomerEmail;
                customerName = orderCustomer.CustomerName;
            }
        }

        if (string.IsNullOrEmpty(customerEmail))
        {
            var payment = await dbContext.Payments
                .Include(p => p.Customer)
                .Where(p => p.Id == message.PaymentId)
                .OrderBy(p => p.Id)
                .Select(p => new { p.CustomerId, CustomerEmail = p.Customer!.Email, CustomerName = p.Customer!.Name })
                .FirstOrDefaultAsync();

            if (payment != null)
            {
                customerId = payment.CustomerId;
                customerEmail = payment.CustomerEmail;
                customerName = payment.CustomerName;
            }
        }

        if (string.IsNullOrEmpty(customerEmail))
            return;

        await messagePublisher.PublishAsync(
            RabbitMQQueues.SendCustomerEmails,
            new SendCustomerEmailsMessage
            {
                PaymentId = message.PaymentId,
                MerchantId = message.MerchantId,
                OrderId = message.OrderId,
                CustomerId = customerId,
                CustomerEmail = customerEmail,
                CustomerName = customerName,
                Environment = message.Environment.ToString()
            });
    }

    private async Task ProcessExpiredAsync(
        PaymentCompletedMessage message,
        PrimaryDbContext dbContext,
        ILedgerService ledgerService,
        INotificationService notificationService,
        IStockService stockService)
    {
        var ledgerResult = await ledgerService.RecordPaymentCancelledAsync(
            message.MerchantId,
            message.MerchantAcquirerId,
            message.PaymentId,
            message.Amount,
            message.PlatformFee,
            "PIX expirado",
            message.MerchantSettlementAmount);

        if (!ledgerResult.Success)
        {
            logger.LogError(
                "Failed to record expired payment cancellation in ledger: PaymentId={PaymentId}, Error={Error}",
                message.PaymentId, ledgerResult.ErrorMessage);
            throw new InvalidOperationException(
                $"Failed to record expired payment {message.PaymentId} in ledger: {ledgerResult.ErrorMessage}");
        }

        if (message.OrderId.HasValue)
        {
            await stockService.ReleaseReservationAsync(message.OrderId.Value, "Pagamento expirado");
            await stockService.ReleaseDigitalItemsAsync(message.OrderId.Value);

            var order = await dbContext.Orders
                .OrderBy(o => o.Id)
                .FirstOrDefaultAsync(o => o.Id == message.OrderId.Value);

            if (order != null && order.Status == OrderStatus.Pending)
            {
                order.Status = OrderStatus.Expired;
                order.UpdatedAt = DateTime.UtcNow;
                await dbContext.SaveChangesAsync();
            }
        }

        if (!message.SuppressWebhookAndNotification)
        {
            var netAmount = message.Amount - message.PlatformFee;
            await notificationService.CreatePaymentNotificationAsync(
                message.MerchantId,
                NotificationTemplates.Payment.Expired.Title,
                NotificationTemplates.Payment.Expired.Message(netAmount),
                NotificationStatusType.PaymentExpired,
                message.Environment,
                NotificationTemplates.Routes.Transactions);
        }
    }

    private async Task ProcessFailedAsync(
        PaymentCompletedMessage message,
        PrimaryDbContext dbContext,
        ILedgerService ledgerService,
        INotificationService notificationService,
        IStockService stockService)
    {
        var ledgerResult = await ledgerService.RecordPaymentCancelledAsync(
            message.MerchantId,
            message.MerchantAcquirerId,
            message.PaymentId,
            message.Amount,
            message.PlatformFee,
            "PIX falhou",
            message.MerchantSettlementAmount);

        if (!ledgerResult.Success)
        {
            logger.LogError(
                "Failed to record failed payment cancellation in ledger: PaymentId={PaymentId}, Error={Error}",
                message.PaymentId, ledgerResult.ErrorMessage);
            throw new InvalidOperationException(
                $"Failed to record failed payment {message.PaymentId} in ledger: {ledgerResult.ErrorMessage}");
        }

        if (message.OrderId.HasValue)
        {
            await stockService.ReleaseReservationAsync(message.OrderId.Value, "Pagamento falhou");
            await stockService.ReleaseDigitalItemsAsync(message.OrderId.Value);

            var order = await dbContext.Orders
                .OrderBy(o => o.Id)
                .FirstOrDefaultAsync(o => o.Id == message.OrderId.Value);

            if (order != null && order.Status == OrderStatus.Pending)
            {
                order.Status = OrderStatus.Cancelled;
                order.UpdatedAt = DateTime.UtcNow;
                await dbContext.SaveChangesAsync();
            }
        }

        if (!message.SuppressWebhookAndNotification)
        {
            var netAmount = message.Amount - message.PlatformFee;
            await notificationService.CreatePaymentNotificationAsync(
                message.MerchantId,
                NotificationTemplates.Payment.Failed.Title,
                NotificationTemplates.Payment.Failed.Message(netAmount),
                NotificationStatusType.PaymentFailed,
                message.Environment,
                NotificationTemplates.Routes.Transactions);
        }
    }

    private async Task ProcessCancelledAsync(
        PaymentCompletedMessage message,
        PrimaryDbContext dbContext,
        ILedgerService ledgerService,
        INotificationService notificationService,
        IStockService stockService)
    {
        var ledgerResult = await ledgerService.RecordPaymentCancelledAsync(
            message.MerchantId,
            message.MerchantAcquirerId,
            message.PaymentId,
            message.Amount,
            message.PlatformFee,
            "PIX cancelado",
            message.MerchantSettlementAmount);

        if (!ledgerResult.Success)
        {
            logger.LogError(
                "Failed to record cancelled payment in ledger: PaymentId={PaymentId}, Error={Error}",
                message.PaymentId, ledgerResult.ErrorMessage);
            throw new InvalidOperationException(
                $"Failed to record cancelled payment {message.PaymentId} in ledger: {ledgerResult.ErrorMessage}");
        }

        if (message.OrderId.HasValue)
        {
            await stockService.ReleaseReservationAsync(message.OrderId.Value, "Pagamento cancelado");
            await stockService.ReleaseDigitalItemsAsync(message.OrderId.Value);

            var order = await dbContext.Orders
                .OrderBy(o => o.Id)
                .FirstOrDefaultAsync(o => o.Id == message.OrderId.Value);

            if (order != null && order.Status == OrderStatus.Pending)
            {
                order.Status = OrderStatus.Cancelled;
                order.UpdatedAt = DateTime.UtcNow;
                await dbContext.SaveChangesAsync();
            }
        }

        if (!message.SuppressWebhookAndNotification)
        {
            var netAmount = message.Amount - message.PlatformFee;
            await notificationService.CreatePaymentNotificationAsync(
                message.MerchantId,
                NotificationTemplates.Payment.Cancelled.Title,
                NotificationTemplates.Payment.Cancelled.Message(netAmount),
                NotificationStatusType.PaymentFailed,
                message.Environment,
                NotificationTemplates.Routes.Transactions);
        }
    }

    private async Task ProcessRefundedAsync(
        PaymentCompletedMessage message,
        ILedgerService ledgerService,
        INotificationService notificationService)
    {
        var ledgerResult = await ledgerService.RecordPaymentRefundedAsync(
            message.MerchantId,
            message.MerchantAcquirerId,
            message.PaymentId,
            message.AcquirerId,
            message.Amount,
            message.PlatformFee,
            message.AcquirerFee,
            message.MerchantSettlementAmount,
            $"Estorno total - TxId: {message.TxId}",
            message.FeeSplitHandling);

        if (!ledgerResult.Success)
        {
            logger.LogError(
                "Failed to record refund in ledger: PaymentId={PaymentId}, Error={Error}",
                message.PaymentId, ledgerResult.ErrorMessage);
            throw new InvalidOperationException(
                $"Failed to record refunded payment {message.PaymentId} in ledger: {ledgerResult.ErrorMessage}");
        }

        if (!message.SuppressWebhookAndNotification)
        {
            var netAmount = message.Amount - message.PlatformFee;
            await notificationService.CreatePaymentNotificationAsync(
                message.MerchantId,
                NotificationTemplates.Payment.Refunded.Title,
                NotificationTemplates.Payment.Refunded.Message(netAmount),
                NotificationStatusType.PaymentRefunded,
                message.Environment,
                NotificationTemplates.Routes.Transactions);
        }
    }

    private async Task ProcessPartiallyRefundedAsync(
        PaymentCompletedMessage message,
        ILedgerService ledgerService,
        INotificationService notificationService)
    {
        var refundedAmount = message.RefundedAmount;
        if (refundedAmount <= 0)
        {
            logger.LogError(
                "PartiallyRefunded without RefundedAmount: PaymentId={PaymentId}",
                message.PaymentId);
            return;
        }

        var ledgerResult = await ledgerService.RecordPaymentPartiallyRefundedAsync(
            message.MerchantId,
            message.MerchantAcquirerId,
            message.PaymentId,
            message.AcquirerId,
            message.Amount,
            refundedAmount,
            message.PlatformFee,
            message.AcquirerFee,
            message.MerchantSettlementAmount,
            $"Estorno parcial ({FormatUtils.FormatCurrency(refundedAmount)}) - TxId: {message.TxId}",
            message.FeeSplitHandling);

        if (!ledgerResult.Success)
        {
            logger.LogError(
                "Failed to record partial refund in ledger: PaymentId={PaymentId}, RefundedAmount={RefundedAmount}, Error={Error}",
                message.PaymentId, refundedAmount, ledgerResult.ErrorMessage);
            throw new InvalidOperationException(
                $"Failed to record partial refund for payment {message.PaymentId} in ledger: {ledgerResult.ErrorMessage}");
        }

        if (!message.SuppressWebhookAndNotification)
        {
            await notificationService.CreatePaymentNotificationAsync(
                message.MerchantId,
                NotificationTemplates.Payment.Refunded.TitlePartial,
                NotificationTemplates.Payment.Refunded.MessagePartial(refundedAmount),
                NotificationStatusType.PaymentRefunded,
                message.Environment,
                NotificationTemplates.Routes.Transactions);
        }
    }
}
