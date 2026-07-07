using FastEndpoints;
using swiftpay_api_payment.EndpointsGroups;
using swiftpay_api_payment.Interfaces;

namespace swiftpay_api_payment.Endpoints.Internal.Cashouts.Evaluate;

public sealed class EvaluateCashoutEndpoint(
    ICashoutService cashoutService
) : Endpoint<EvaluateCashoutRequest, EvaluateCashoutResponse>
{
    public override void Configure()
    {
        Post("{cashoutId:guid}/evaluate");
        Group<InternalCashoutGroup>();
    }

    public override async Task HandleAsync(EvaluateCashoutRequest req, CancellationToken ct)
    {
        if (req.Action == EvaluateAction.Approve)
        {
            var result = await cashoutService.ApproveAsync(req.CashoutId, req.EvaluatedById, ct);

            await Send.ResponseAsync(new EvaluateCashoutResponse
            {
                Success = result.Success,
                CashoutId = result.CashoutId,
                Status = result.Status?.ToString(),
                AcquirerTransactionId = result.AcquirerTransactionId,
                ErrorMessage = result.ErrorMessage,
                ErrorCode = result.ErrorCode
            }, result.StatusCode, ct);
        }
        else
        {
            if (string.IsNullOrWhiteSpace(req.Reason))
            {
                await Send.ResponseAsync(new EvaluateCashoutResponse
                {
                    Success = false,
                    ErrorMessage = "O motivo da rejeição é obrigatório.",
                    ErrorCode = "reason_required"
                }, 400, ct);
                return;
            }

            var result = await cashoutService.RejectAsync(req.CashoutId, req.EvaluatedById, req.Reason, ct);

            await Send.ResponseAsync(new EvaluateCashoutResponse
            {
                Success = result.Success,
                CashoutId = result.CashoutId,
                Status = result.Status?.ToString(),
                ErrorMessage = result.ErrorMessage,
                ErrorCode = result.ErrorCode
            }, result.StatusCode, ct);
        }
    }
}
