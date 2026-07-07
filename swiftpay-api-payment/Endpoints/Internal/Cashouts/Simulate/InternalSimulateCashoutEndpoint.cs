using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_payment.EndpointsGroups;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_payment.Services.Sandbox;
using swiftpay_api_core.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_payment.Endpoints.Internal.Cashouts.Simulate;

public sealed class InternalSimulateCashoutEndpoint(
    ICashoutService cashoutService,
    PrimaryDbContext dbContext
) : Endpoint<InternalSimulateCashoutRequest, InternalSimulateCashoutResponse>
{
    public override void Configure()
    {
        Post("{cashoutId:guid}/simulate");
        Group<InternalCashoutGroup>();
    }

    public override async Task HandleAsync(InternalSimulateCashoutRequest req, CancellationToken ct)
    {
        var payout = await dbContext.Payouts
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == req.CashoutId, ct);

        if (payout == null)
        {
            await Send.ResponseAsync(new InternalSimulateCashoutResponse
            {
                Error = new InternalSimulateCashoutError
                {
                    Message = "Saque não encontrado.",
                    Code = "cashout_not_found"
                }
            }, 404, ct);
            return;
        }

        if (payout.Environment != ApiEnvironment.Sandbox)
        {
            await Send.ResponseAsync(new InternalSimulateCashoutResponse
            {
                Error = new InternalSimulateCashoutError
                {
                    Message = "A simulação só está disponível em ambiente Sandbox.",
                    Code = "sandbox_only"
                }
            }, 400, ct);
            return;
        }

        if (!Enum.TryParse<SimulateCashoutAction>(req.Action, true, out var action))
        {
            await Send.ResponseAsync(new InternalSimulateCashoutResponse
            {
                Error = new InternalSimulateCashoutError
                {
                    Message = "Ação inválida.",
                    Code = "invalid_action"
                }
            }, 400, ct);
            return;
        }

        var result = await cashoutService.SimulateAsync(
            payout.MerchantId,
            req.CashoutId,
            ApiEnvironment.Sandbox,
            action,
            ct);

        if (!result.Success)
        {
            await Send.ResponseAsync(new InternalSimulateCashoutResponse
            {
                Error = new InternalSimulateCashoutError
                {
                    Message = result.ErrorMessage,
                    Code = result.ErrorCode
                }
            }, result.StatusCode, ct);
            return;
        }

        await Send.ResponseAsync(new InternalSimulateCashoutResponse
        {
            Data = new InternalSimulateCashoutData
            {
                Id = result.CashoutId ?? req.CashoutId,
                Status = result.Status?.ToString(),
                Pix = new InternalSimulateCashoutPixData
                {
                    EndToEndId = result.EndToEndId,
                    AcquirerTransactionId = result.AcquirerTransactionId
                }
            },
            Message = GetSuccessMessage(action)
        }, 200, ct);
    }

    private static string GetSuccessMessage(SimulateCashoutAction action)
    {
        return action switch
        {
            SimulateCashoutAction.Complete => "Saque simulado como concluído com sucesso.",
            SimulateCashoutAction.Fail => "Saque simulado como falha.",
            SimulateCashoutAction.Reject => "Saque simulado como rejeitado.",
            _ => "Simulação concluída."
        };
    }
}
