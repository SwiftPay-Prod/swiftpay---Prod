using FastEndpoints;
using swiftpay_api_payment.EndpointsGroups;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_payment.Services.Sandbox;

namespace swiftpay_api_payment.Endpoints.Internal.Transactions.Simulate;

public sealed class InternalSimulateTransactionEndpoint(
    ITransactionService transactionService
) : Endpoint<InternalSimulateTransactionRequest, InternalSimulateTransactionResponse>
{
    public override void Configure()
    {
        Post("{transactionId:guid}/simulate");
        Group<InternalTransactionsGroup>();
    }

    public override async Task HandleAsync(InternalSimulateTransactionRequest req, CancellationToken ct)
    {
        var action = req.Action.ToLower() switch
        {
            "complete" => SimulateAction.Complete,
            "expire" => SimulateAction.Expire,
            "fail" => SimulateAction.Fail,
            "refund" => SimulateAction.Refund,
            _ => SimulateAction.Complete
        };

        var result = await transactionService.SimulateAsync(req.TransactionId, req.MerchantId, action);

        if (!result.Success || result.Payment == null)
        {
            await Send.ResponseAsync(new InternalSimulateTransactionResponse
            {
                Data = new InternalSimulateTransactionData
                {
                    Success = false,
                    TransactionId = req.TransactionId,
                    ErrorMessage = result.ErrorMessage ?? "Erro ao simular transação.",
                    ErrorCode = "simulation_failed"
                }
            }, result.StatusCode, ct);
            return;
        }

        await Send.OkAsync(new InternalSimulateTransactionResponse
        {
            Data = new InternalSimulateTransactionData
            {
                Success = true,
                TransactionId = result.Payment.Id,
                Status = result.Payment.Status,
                SimulatedAction = req.Action.ToLower(),
                CompletedAt = result.Payment.CompletedAt,
                RefundedAt = result.Payment.RefundedAt
            },
            Message = $"Transação simulada com sucesso. Ação: {req.Action.ToLower()}"
        }, ct);
    }
}
