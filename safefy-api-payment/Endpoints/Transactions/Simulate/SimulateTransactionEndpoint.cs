using FastEndpoints;
using safefy_api_payment.EndpointsGroups;
using safefy_api_payment.Endpoints.Utils;
using safefy_api_payment.Interfaces;
using safefy_api_payment.Documentation;
using safefy_api_payment.Mappers;
using safefy_api_payment.Endpoints.Models;
using safefy_api_payment.Services.Sandbox;
using safefy_api_core.Models.Enum;

namespace safefy_api_payment.Endpoints.Transactions.Simulate;

public sealed class SimulateTransactionEndpoint(
    ITransactionService transactionService
) : Endpoint<SimulateTransactionRequest, SimulateTransactionResponse>
{
    public override void Configure()
    {
        Post("{transactionId:guid}/simulate");
        Group<TransactionsGroup>();
        Description(d => d
            .Produces<SimulateTransactionResponse>(200, "application/json")
            .Produces<SimulateTransactionResponse>(400, "application/json")
            .Produces<SimulateTransactionResponse>(401, "application/json")
            .Produces<SimulateTransactionResponse>(404, "application/json")
            .WithSummary("Simular transação (Sandbox)")
            .WithDescription(EndpointDescriptions.SimulateTransactionDescription));
    }

    public override async Task HandleAsync(SimulateTransactionRequest req, CancellationToken ct)
    {
        var merchantId = PaymentEndpointUtils.GetMerchantId(User);
        var environment = PaymentEndpointUtils.GetEnvironment(User);

        if (merchantId == null || !environment.HasValue)
        {
            await Send.ResponseAsync(new SimulateTransactionResponse
            {
                Error = new ApiErrorResponse("Token inválido.", "invalid_token")
            }, 401, ct);
            return;
        }

        if (environment.Value != ApiEnvironment.Sandbox)
        {
            await Send.ResponseAsync(new SimulateTransactionResponse
            {
                Error = new ApiErrorResponse("A simulação de transações só está disponível em ambiente Sandbox.", "sandbox_only")
            }, 400, ct);
            return;
        }

        var action = req.Action.ToLower() switch
        {
            "complete" => SimulateAction.Complete,
            "expire" => SimulateAction.Expire,
            "fail" => SimulateAction.Fail,
            "refund" => SimulateAction.Refund,
            _ => SimulateAction.Complete
        };

        var result = await transactionService.SimulateAsync(req.TransactionId, merchantId.Value, action);

        if (!result.Success || result.Payment == null)
        {
            await Send.ResponseAsync(new SimulateTransactionResponse
            {
                Error = new(result.ErrorMessage ?? "Erro ao simular transação.")
            }, result.StatusCode, ct);
            return;
        }

        var response = new SimulateTransactionResponse
        {
            Data = TransactionMapper.ToSimulationData(result.Payment, req.Action.ToLower(), result.PaymentPix),
            Message = $"Transação simulada com sucesso. Ação: {req.Action.ToLower()}"
        };

        await Send.OkAsync(response, ct);
    }
}
