using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.EndpointsGroups;
using safefy_api.Interfaces;
using safefy_api.Models.PaymentApi;
using safefy_api_core.Database;
using safefy_api_core.Models.Enum;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Merchants.Payments.SimulatePayment;

public sealed class SimulatePaymentEndpoint(
    PrimaryDbContext dbContext,
    IPaymentApiClient paymentApiClient
) : Endpoint<SimulatePaymentRequest, SimulatePaymentResponse>
{
    public override void Configure()
    {
        Post("{merchantId:guid}/payments/{paymentId:guid}/simulate");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(SimulatePaymentRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new SimulatePaymentResponse
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
            await Send.ResponseAsync(new SimulatePaymentResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var payment = await dbContext.Payments
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(p => p.Id == req.PaymentId && p.MerchantId == req.MerchantId, ct);

        if (payment == null)
        {
            await Send.ResponseAsync(new SimulatePaymentResponse
            {
                Error = new("Transação não encontrada.")
            }, 404, ct);
            return;
        }

        if (payment.Environment != ApiEnvironment.Sandbox)
        {
            await Send.ResponseAsync(new SimulatePaymentResponse
            {
                Error = new("A simulação de transações só está disponível em ambiente Sandbox.")
            }, 400, ct);
            return;
        }

        var result = await paymentApiClient.SimulateTransactionAsync(new SimulateTransactionApiInput
        {
            TransactionId = req.PaymentId,
            MerchantId = req.MerchantId,
            Action = req.Action
        }, ct);

        if (!result.Success)
        {
            await Send.ResponseAsync(new SimulatePaymentResponse
            {
                Error = new(result.ErrorMessage ?? "Erro ao simular transação.")
            }, 400, ct);
            return;
        }

        await Send.OkAsync(new SimulatePaymentResponse
        {
            Data = new SimulatePaymentData
            {
                Id = result.TransactionId ?? req.PaymentId,
                Status = result.Status ?? default,
                SimulatedAction = result.SimulatedAction ?? req.Action.ToLower(),
                CompletedAt = result.CompletedAt,
                RefundedAt = result.RefundedAt
            },
            Message = $"Transação simulada com sucesso. Ação: {req.Action.ToLower()}"
        }, ct);
    }
}
