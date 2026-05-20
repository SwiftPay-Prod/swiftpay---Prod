using FastEndpoints;
using safefy_api_core.Models.Database;
using safefy_api_payment.EndpointsGroups;
using safefy_api_payment.Endpoints.Utils;
using safefy_api_payment.Interfaces;
using safefy_api_payment.Endpoints.Models;
using safefy_api_payment.Documentation;

namespace safefy_api_payment.Endpoints.Cashouts.Simulate;

public sealed class SimulateCashoutEndpoint(
    ICashoutService cashoutService
) : Endpoint<SimulateCashoutRequest, SimulateCashoutResponse>
{
    public override void Configure()
    {
        Post("{id:guid}/simulate");
        Group<CashoutGroup>();
        Description(d => d
            .Produces<SimulateCashoutResponse>(200, "application/json")
            .Produces<SimulateCashoutResponse>(400, "application/json")
            .Produces<SimulateCashoutResponse>(404, "application/json")
            .Produces<SimulateCashoutResponse>(401, "application/json")
            .WithSummary("Simular saque (Sandbox)")
            .WithDescription(EndpointDescriptions.Cashouts.Simulate));
    }

    public override async Task HandleAsync(SimulateCashoutRequest req, CancellationToken ct)
    {
        var merchantId = PaymentEndpointUtils.GetMerchantId(User);
        var environment = PaymentEndpointUtils.GetEnvironment(User);

        if (merchantId == null || !environment.HasValue)
        {
            await Send.ResponseAsync(new SimulateCashoutResponse
            {
                Error = new ApiErrorResponse("Token inválido.", "invalid_token")
            }, 401, ct);
            return;
        }

        if (!Enum.TryParse<Services.Sandbox.SimulateCashoutAction>(req.Action, true, out var action))
        {
            await Send.ResponseAsync(new SimulateCashoutResponse
            {
                Error = new ApiErrorResponse("Ação de simulação inválida.", "invalid_action")
            }, 400, ct);
            return;
        }

        var result = await cashoutService.SimulateAsync(
            merchantId.Value, 
            req.Id, 
            environment.Value, 
            action, 
            ct);

        if (!result.Success)
        {
            await Send.ResponseAsync(new SimulateCashoutResponse
            {
                Error = new(result.ErrorMessage ?? "Erro ao simular saque.", result.ErrorCode)
            }, result.StatusCode, ct);
            return;
        }

        var response = new SimulateCashoutResponse
        {
            Data = new SimulateCashoutData
            {
                Id = result.CashoutId ?? req.Id,
                Status = result.Status ?? PayoutStatus.Pending,
                Pix = new SimulateCashoutPixData
                {
                    EndToEndId = result.EndToEndId,
                    AcquirerTransactionId = result.AcquirerTransactionId
                }
            },
            Message = GetSuccessMessage(action)
        };

        await Send.ResponseAsync(response, 200, ct);
    }

    private static string GetSuccessMessage(Services.Sandbox.SimulateCashoutAction action)
    {
        return action switch
        {
            Services.Sandbox.SimulateCashoutAction.Complete => "Saque simulado como concluído com sucesso.",
            Services.Sandbox.SimulateCashoutAction.Fail => "Saque simulado como falha.",
            Services.Sandbox.SimulateCashoutAction.Reject => "Saque simulado como rejeitado.",
            _ => "Simulação concluída."
        };
    }
}
