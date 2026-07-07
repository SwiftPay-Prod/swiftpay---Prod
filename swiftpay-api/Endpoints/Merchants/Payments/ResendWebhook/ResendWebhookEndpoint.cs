using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api.EndpointsGroups;
using swiftpay_api.Interfaces;
using swiftpay_api.Models.PaymentApi;
using swiftpay_api_core.Database;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Merchants.Payments.ResendWebhook;

public sealed class ResendWebhookEndpoint(
    PrimaryDbContext dbContext,
    IPaymentApiClient paymentApiClient
) : Endpoint<ResendWebhookRequest, ResendWebhookResponse>
{
    public override void Configure()
    {
        Post("{merchantId:guid}/payments/{paymentId:guid}/resend-webhook");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ResendWebhookRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ResendWebhookResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new ResendWebhookResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        if (merchant.Status != MerchantStatus.Active)
        {
            await Send.ResponseAsync(new ResendWebhookResponse
            {
                Error = new("A organização não está ativa.")
            }, 403, ct);
            return;
        }

        var result = await paymentApiClient.ResendWebhookAsync(
            new ResendWebhookApiInput
            {
                TransactionId = req.PaymentId,
                MerchantId = req.MerchantId
            }, ct);

        if (!result.Success)
        {
            var statusCode = result.ErrorCode switch
            {
                "TRANSACTION_NOT_FOUND" => 404,
                "WEBHOOK_NOT_CONFIGURED" => 400,
                "INVALID_PAYMENT_STATUS" => 400,
                _ => 500
            };

            await Send.ResponseAsync(new ResendWebhookResponse
            {
                Error = new(result.ErrorMessage ?? "Erro ao reenviar webhook.")
            }, statusCode, ct);
            return;
        }

        await Send.ResponseAsync(new ResendWebhookResponse
        {
            Data = new ResendWebhookData
            {
                PaymentId = result.TransactionId ?? req.PaymentId,
                CallbackStatus = result.CallbackStatus ?? CallbackStatus.Pending
            },
            Message = "Webhook adicionado à fila de processamento com sucesso."
        }, 200, ct);
    }
}
