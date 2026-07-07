using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api.EndpointsGroups;
using swiftpay_api.Interfaces;
using swiftpay_api.Models.PaymentApi;
using swiftpay_api_core.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Merchants.Cashouts.SimulateCashout;

public sealed class SimulateCashoutEndpoint(
    PrimaryDbContext dbContext,
    IPaymentApiClient paymentApiClient
) : Endpoint<SimulateCashoutRequest, SimulateCashoutResponse>
{
    public override void Configure()
    {
        Post("{merchantId:guid}/cashouts/{cashoutId:guid}/simulate");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(SimulateCashoutRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new SimulateCashoutResponse
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
            await Send.ResponseAsync(new SimulateCashoutResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var payout = await dbContext.Payouts
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(p => p.Id == req.CashoutId && p.MerchantId == req.MerchantId, ct);

        if (payout == null)
        {
            await Send.ResponseAsync(new SimulateCashoutResponse
            {
                Error = new("Saque não encontrado.")
            }, 404, ct);
            return;
        }

        if (payout.Environment != ApiEnvironment.Sandbox)
        {
            await Send.ResponseAsync(new SimulateCashoutResponse
            {
                Error = new("A simulação de saques só está disponível em ambiente Sandbox.")
            }, 400, ct);
            return;
        }

        var result = await paymentApiClient.SimulateCashoutAsync(new SimulateCashoutApiInput
        {
            CashoutId = req.CashoutId,
            MerchantId = req.MerchantId,
            Action = req.Action
        }, ct);

        if (!result.Success)
        {
            await Send.ResponseAsync(new SimulateCashoutResponse
            {
                Error = new(result.ErrorMessage ?? "Erro ao simular saque.")
            }, result.StatusCode > 0 ? result.StatusCode : 400, ct);
            return;
        }

        await Send.OkAsync(new SimulateCashoutResponse
        {
            Data = new SimulateCashoutData
            {
                Id = result.CashoutId ?? req.CashoutId,
                Status = result.Status ?? default,
                SimulatedAction = result.SimulatedAction ?? req.Action.ToLower(),
                CompletedAt = result.CompletedAt,
                FailureReason = result.FailureReason,
                EndToEndId = result.EndToEndId
            },
            Message = $"Saque simulado com sucesso. Ação: {req.Action.ToLower()}"
        }, ct);
    }
}
