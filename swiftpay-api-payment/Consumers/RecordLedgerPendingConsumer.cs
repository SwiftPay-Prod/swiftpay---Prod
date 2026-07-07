using MassTransit;
using Microsoft.Extensions.DependencyInjection;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Messages;
using swiftpay_api_core.Services;
using swiftpay_api_payment.Interfaces.Internal;

namespace swiftpay_api_payment.Consumers;

public sealed class RecordLedgerPendingConsumer(
    IServiceScopeFactory scopeFactory,
    ILogger<RecordLedgerPendingConsumer> logger
) : IConsumer<RecordLedgerPendingMessage>
{
    public async Task Consume(ConsumeContext<RecordLedgerPendingMessage> context)
    {
        var message = context.Message;

        try
        {
            // Define o environment ANTES de criar o scope para que o DbContext use o QueryFilter correto
            using var environmentScope = HybridEnvironmentProvider.SetEnvironment(message.Environment);
            using var scope = scopeFactory.CreateScope();
            var ledgerService = scope.ServiceProvider.GetRequiredService<ILedgerService>();
            var transactionTrackingIntegrationService = scope.ServiceProvider.GetRequiredService<ITransactionTrackingIntegrationService>();

            var result = await ledgerService.RecordPaymentPendingAsync(
                message.MerchantId,
                message.MerchantAcquirerId,
                message.PaymentId,
                message.Amount,
                message.PlatformFee,
                message.Description ?? "Pagamento PIX pendente",
                message.MerchantSettlementAmount);

            if (!result.Success)
            {
                logger.LogError(
                    "Failed to record pending payment in ledger: PaymentId={PaymentId}, Error={Error}",
                    message.PaymentId, result.ErrorMessage);
                
                throw new InvalidOperationException(result.ErrorMessage);
            }

            await transactionTrackingIntegrationService.NotifyPaymentStatusAsync(
                message.PaymentId,
                message.MerchantId,
                PaymentStatus.Pending,
                message.Environment,
                context.CancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Error processing RecordLedgerPendingMessage: PaymentId={PaymentId}",
                message.PaymentId);
            throw;
        }
    }
}
