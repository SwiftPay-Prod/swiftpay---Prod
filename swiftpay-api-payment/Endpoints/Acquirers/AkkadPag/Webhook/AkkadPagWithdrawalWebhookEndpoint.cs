using FastEndpoints;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_payment.Endpoints.Acquirers.AkkadPag.Webhook;
using swiftpay_api_payment.EndpointsGroups.Acquirers;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_payment.Services.Acquirers.Utils;
using swiftpay_api_payment.Services.Helpers;

namespace swiftpay_api_payment.Endpoints.Acquirers.AkkadPag.Webhook;

public sealed class AkkadPagWithdrawalWebhookEndpoint(
    ICashoutService cashoutService,
    IPlatformPayoutWebhookService platformPayoutWebhookService,
    PrimaryDbContext dbContext,
    IApiLogService apiLogService,
    ILogger<AkkadPagWithdrawalWebhookEndpoint> logger
) : Endpoint<AkkadPagWithdrawalWebhookRequest, AkkadPagWebhookResponse>
{
    public override void Configure()
    {
        Post("webhooks/withdrawals");
        Group<AkkadPagGroup>();
    }

    public override async Task HandleAsync(AkkadPagWithdrawalWebhookRequest req, CancellationToken ct)
    {
        try
        {
            if (req.Withdrawal is null || string.IsNullOrWhiteSpace(req.Withdrawal.Id))
            {
                await SendOkAsync(ct);
                return;
            }

            await ProcessWithdrawalAsync(req.Withdrawal, ct);
            await SendOkAsync(ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing AkkadPag withdrawal webhook: {WithdrawalId}", req.Withdrawal?.Id);
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.AkkadPag,
                "Erro interno ao processar webhook de saque.",
                "internal_error",
                req,
                null,
                null,
                req.Withdrawal?.Id,
                ct);

            await Send.ResponseAsync(new AkkadPagWebhookResponse(), 200, cancellation: ct);
        }
    }

    private async Task ProcessWithdrawalAsync(AkkadPagWithdrawalWebhookWithdrawal withdrawal, CancellationToken ct)
    {
        var status = AkkadPagStatusConverter.ToWithdrawStatus(withdrawal.Status);
        var payoutStatus = status switch
        {
            WithdrawStatus.Completed => PayoutStatus.Completed,
            WithdrawStatus.Failed => PayoutStatus.Failed,
            WithdrawStatus.Processing => PayoutStatus.Processing,
            _ => PayoutStatus.Processing
        };

        var rejectReason = payoutStatus is PayoutStatus.Failed or PayoutStatus.Rejected
            ? "Saque recusado pela AkkadPag."
            : null;

        var result = await cashoutService.ProcessAcquirerWebhookAsync(new AcquirerCashoutWebhookData
        {
            AcquirerType = AcquirerType.AkkadPag,
            TxId = withdrawal.Id,
            Status = payoutStatus,
            AcquirerTransactionId = withdrawal.Id,
            RejectReason = rejectReason,
            CompletedAt = payoutStatus == PayoutStatus.Completed ? (withdrawal.PaidAt ?? DateTime.UtcNow) : null
        }, ct);

        if (result.PayoutNotFound)
        {
            await platformPayoutWebhookService.TryProcessWebhookAsync(
                AcquirerType.AkkadPag,
                withdrawal.Id,
                payoutStatus,
                null,
                withdrawal.Id,
                rejectReason,
                ct);
            return;
        }

        if (!result.Success)
        {
            logger.LogError("Failed to process AkkadPag withdrawal webhook: {Error}", result.ErrorMessage);
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.AkkadPag,
                result.ErrorMessage,
                null,
                null,
                null,
                withdrawal.Id,
                withdrawal.Id,
                ct);
            return;
        }

        await WebhookLogHelper.LogEventAsync(
            apiLogService,
            dbContext,
            HttpContext,
            AcquirerType.AkkadPag,
            ApiLogStatus.Success,
            $"Webhook AkkadPag withdrawal processado com status {payoutStatus}.",
            null,
            new { processed = true, status = payoutStatus.ToString(), payoutId = result.PayoutId },
            withdrawal.Id,
            withdrawal.Id,
            ct: ct);
    }

    private Task SendOkAsync(CancellationToken ct)
    {
        return Send.ResponseAsync(new AkkadPagWebhookResponse(), 200, cancellation: ct);
    }
}
