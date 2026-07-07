using FastEndpoints;
using swiftpay_api.EndpointsGroups;
using swiftpay_api.Interfaces;
using swiftpay_api.Models.PaymentApi;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Admin.Logs.ReprocessAcquirerWebhookDev;

public sealed class ReprocessAcquirerWebhookDevEndpoint(
    IPaymentApiClient paymentApiClient
) : Endpoint<ReprocessAcquirerWebhookDevRequest, ReprocessAcquirerWebhookDevResponse>
{
    public override void Configure()
    {
        Post("logs/acquirer-webhooks/{webhookLogId:guid}/dev/reprocess");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ReprocessAcquirerWebhookDevRequest req, CancellationToken ct)
    {
        var role = EndpointUtils.GetUserRole(User);
        if (role != nameof(UserRole.God))
        {
            await Send.ForbiddenAsync(ct);
            return;
        }

        var result = await paymentApiClient.ReprocessAcquirerWebhookDevAsync(new ReprocessAcquirerWebhookDevApiInput
        {
            WebhookLogId = req.WebhookLogId
        }, ct);

        if (!result.Success)
        {
            var statusCode = result.ErrorCode == "webhook_log_not_found" ? 404 : 400;
            await Send.ResponseAsync(new ReprocessAcquirerWebhookDevResponse
            {
                Error = new(result.ErrorMessage ?? "Erro ao reprocessar webhook da adquirente.")
            }, statusCode, ct);
            return;
        }

        await Send.OkAsync(new ReprocessAcquirerWebhookDevResponse
        {
            Data = new AdminReprocessAcquirerWebhookDevData
            {
                WebhookLogId = result.WebhookLogId,
                AcquirerType = result.AcquirerType,
                PaymentId = result.PaymentId,
                PayoutId = result.PayoutId,
                Status = result.Status
            },
            Message = "Webhook de adquirente reprocessado com sucesso."
        }, ct);
    }
}
