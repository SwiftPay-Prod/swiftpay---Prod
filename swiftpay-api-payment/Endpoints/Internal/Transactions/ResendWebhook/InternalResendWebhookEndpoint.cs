using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_payment.EndpointsGroups;
using safefy_api_core.Database;
using safefy_api_core.Models.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Constants;
using safefy_api_core.Models.Messages;

namespace safefy_api_payment.Endpoints.Internal.Transactions.ResendWebhook;

public sealed class InternalResendWebhookEndpoint(
    PrimaryDbContext dbContext,
    IMessagePublisher messagePublisher
) : Endpoint<InternalResendWebhookRequest, InternalResendWebhookResponse>
{
    public override void Configure()
    {
        Post("{transactionId:guid}/resend-webhook");
        Group<InternalTransactionsGroup>();
    }

    public override async Task HandleAsync(InternalResendWebhookRequest req, CancellationToken ct)
    {
        var payment = await dbContext.Payments
            .FirstOrDefaultAsync(p => 
                p.Id == req.TransactionId && 
                p.MerchantId == req.MerchantId, 
                ct);

        if (payment == null)
        {
            await Send.ResponseAsync(new InternalResendWebhookResponse
            {
                Data = new InternalResendWebhookData
                {
                    Success = false,
                    ErrorMessage = "Transação não encontrada.",
                    ErrorCode = "transaction_not_found"
                }
            }, 404, ct);
            return;
        }

        if (payment.Status != PaymentStatus.Completed)
        {
            await Send.ResponseAsync(new InternalResendWebhookResponse
            {
                Data = new InternalResendWebhookData
                {
                    Success = false,
                    ErrorMessage = "Somente transações confirmadas podem ter webhook reenviado.",
                    ErrorCode = "invalid_status"
                }
            }, 400, ct);
            return;
        }

        if (string.IsNullOrEmpty(payment.CallbackUrl))
        {
            await Send.ResponseAsync(new InternalResendWebhookResponse
            {
                Data = new InternalResendWebhookData
                {
                    Success = false,
                    ErrorMessage = "Esta transação não possui URL de callback configurada.",
                    ErrorCode = "no_callback_url"
                }
            }, 400, ct);
            return;
        }

        payment.CallbackStatus = CallbackStatus.Pending;
        await dbContext.SaveChangesAsync(ct);

        await messagePublisher.PublishAsync(RabbitMQQueues.SendWebhook, new SendWebhookMessage
        {
            PaymentId = payment.Id,
            EventType = "payment.completed"
        });

        await Send.OkAsync(new InternalResendWebhookResponse
        {
            Data = new InternalResendWebhookData
            {
                Success = true,
                TransactionId = payment.Id,
                CallbackStatus = payment.CallbackStatus
            },
            Message = "Webhook enfileirado para reenvio com sucesso."
        }, ct);
    }
}
