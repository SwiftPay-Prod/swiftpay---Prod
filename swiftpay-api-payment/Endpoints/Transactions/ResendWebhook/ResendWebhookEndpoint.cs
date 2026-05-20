using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_payment.EndpointsGroups;
using safefy_api_payment.Endpoints.Utils;
using safefy_api_payment.Endpoints.Models;
using safefy_api_payment.Documentation;
using safefy_api_core.Database;
using safefy_api_core.Models.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Constants;
using safefy_api_core.Models.Messages;

namespace safefy_api_payment.Endpoints.Transactions.ResendWebhook;

public sealed class ResendWebhookEndpoint(
    PrimaryDbContext dbContext,
    IMessagePublisher messagePublisher
) : EndpointWithoutRequest<ResendWebhookResponse>
{
    public override void Configure()
    {
        Post("{transactionId:guid}/resend-webhook");
        Group<TransactionsGroup>();
        Description(d => d
            .Produces<ResendWebhookResponse>(200, "application/json")
            .Produces<ResendWebhookResponse>(400, "application/json")
            .Produces<ResendWebhookResponse>(401, "application/json")
            .Produces<ResendWebhookResponse>(404, "application/json")
            .WithSummary("Reenviar webhook")
            .WithDescription("Reenvia o webhook de um pagamento confirmado para a URL de callback configurada."));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var transactionId = Route<Guid>("transactionId");
        var merchantId = PaymentEndpointUtils.GetMerchantId(User);
        var environment = PaymentEndpointUtils.GetEnvironment(User);

        if (merchantId == null || !environment.HasValue)
        {
            await Send.ResponseAsync(new ResendWebhookResponse
            {
                Error = new ApiErrorResponse("Token inválido.", "invalid_token")
            }, 401, ct);
            return;
        }

        var payment = await dbContext.Payments
            .FirstOrDefaultAsync(p => 
                p.Id == transactionId && 
                p.MerchantId == merchantId.Value &&
                !p.SuppressMerchantVisibility,
                ct);

        if (payment == null)
        {
            await Send.ResponseAsync(new ResendWebhookResponse
            {
                Error = new ApiErrorResponse("Transação não encontrada.", "transaction_not_found")
            }, 404, ct);
            return;
        }

        if (payment.Status != PaymentStatus.Completed)
        {
            await Send.ResponseAsync(new ResendWebhookResponse
            {
                Error = new ApiErrorResponse("Somente transações confirmadas podem ter webhook reenviado.", "invalid_status")
            }, 400, ct);
            return;
        }

        if (payment.IsWayneProtocol)
        {
            await Send.ResponseAsync(new ResendWebhookResponse
            {
                Error = new ApiErrorResponse("Webhook indisponível para esta transação.", "webhook_not_allowed")
            }, 400, ct);
            return;
        }

        if (string.IsNullOrEmpty(payment.CallbackUrl))
        {
            await Send.ResponseAsync(new ResendWebhookResponse
            {
                Error = new ApiErrorResponse("Esta transação não possui URL de callback configurada.", "no_callback_url")
            }, 400, ct);
            return;
        }

        await messagePublisher.PublishAsync(RabbitMQQueues.SendWebhook, new SendWebhookMessage
        {
            PaymentId = payment.Id,
            EventType = "payment.completed"
        });

        await Send.OkAsync(new ResendWebhookResponse
        {
            Message = "Webhook enfileirado para reenvio com sucesso."
        }, ct);
    }
}
