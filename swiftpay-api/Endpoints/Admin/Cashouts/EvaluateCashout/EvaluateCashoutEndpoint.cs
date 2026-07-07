using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api.EndpointsGroups;
using swiftpay_api.Interfaces;
using swiftpay_api.Models.PaymentApi;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Admin.Cashouts.EvaluateCashout;

public sealed class EvaluateCashoutEndpoint(
    PrimaryDbContext dbContext,
    IPaymentApiClient paymentApiClient,
    IApiLogService apiLogService
) : Endpoint<EvaluateCashoutRequest, EvaluateCashoutResponse>
{
    public override void Configure()
    {
        Post("cashouts/{cashoutId:guid}/evaluate");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(EvaluateCashoutRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new EvaluateCashoutResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var payout = await dbContext.Payouts
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(p => p.Id == req.CashoutId, ct);

        if (payout == null)
        {
            await Send.ResponseAsync(new EvaluateCashoutResponse
            {
                Error = new("Saque não encontrado.")
            }, 404, ct);
            return;
        }

        if (payout.Status != PayoutStatus.Pending)
        {
            await Send.ResponseAsync(new EvaluateCashoutResponse
            {
                Error = new($"O saque não pode ser {(req.Action == CashoutEvaluateAction.Approve ? "aprovado" : "rejeitado")}. Status atual: {payout.Status}")
            }, 400, ct);
            return;
        }

        var action = req.Action == CashoutEvaluateAction.Approve
            ? EvaluateCashoutAction.Approve
            : EvaluateCashoutAction.Reject;

        var merchantInfo = await dbContext.Merchants
            .AsNoTracking()
            .Where(m => m.Id == payout.MerchantId)
            .OrderBy(m => m.Id)
            .Select(m => new
            {
                m.Name,
                Document = m.MerchantKyc != null ? m.MerchantKyc.DocumentNumber : null
            })
            .FirstOrDefaultAsync(ct);

        var result = await paymentApiClient.EvaluateCashoutAsync(new EvaluateCashoutApiInput
        {
            CashoutId = payout.Id,
            EvaluatedById = userId.Value,
            Action = action,
            Reason = req.Reason
        }, ct);

        if (!result.Success)
        {
            var logAction = req.Action == CashoutEvaluateAction.Approve
                ? ApiLogAction.ApproveCashout
                : ApiLogAction.RejectCashout;

            await apiLogService.LogAsync(new ApiLogInput
            {
                Action = logAction,
                Status = ApiLogStatus.Failed,
                MerchantId = payout.MerchantId,
                MerchantName = merchantInfo?.Name,
                MerchantDocument = merchantInfo?.Document,
                HttpMethod = HttpContext.Request.Method,
                Endpoint = HttpContext.Request.Path,
                StatusCode = 400,
                Details = $"Falha ao {(req.Action == CashoutEvaluateAction.Approve ? "aprovar" : "rejeitar")} saque {payout.Id}: {result.ErrorMessage}",
                ResourceId = payout.Id,
                ResourceType = ApiLogResourceType.Payout
            });

            await Send.ResponseAsync(new EvaluateCashoutResponse
            {
                Error = new(result.ErrorMessage ?? "Erro ao processar saque.")
            }, 400, ct);
            return;
        }

        if (req.Action == CashoutEvaluateAction.Approve)
        {
            await apiLogService.LogAsync(new ApiLogInput
            {
                Action = ApiLogAction.ApproveCashout,
                Status = ApiLogStatus.Success,
                MerchantId = payout.MerchantId,
                MerchantName = merchantInfo?.Name,
                MerchantDocument = merchantInfo?.Document,
                HttpMethod = HttpContext.Request.Method,
                Endpoint = HttpContext.Request.Path,
                StatusCode = 200,
                Details = $"Saque {payout.Id} aprovado. Valor: R$ {payout.Amount / 100m:N2}. Status: {result.Status}",
                ResourceId = payout.Id,
                ResourceType = ApiLogResourceType.Payout
            });

            await Send.OkAsync(new EvaluateCashoutResponse
            {
                Data = new EvaluateCashoutData
                {
                    Id = result.CashoutId ?? payout.Id,
                    Status = result.Status ?? PayoutStatus.Processing,
                    AcquirerTransactionId = result.AcquirerTransactionId,
                    Message = GetApproveStatusMessage(result.Status)
                },
                Message = "Saque aprovado e enviado para processamento."
            }, ct);
        }
        else
        {
            await apiLogService.LogAsync(new ApiLogInput
            {
                Action = ApiLogAction.RejectCashout,
                Status = ApiLogStatus.Success,
                MerchantId = payout.MerchantId,
                MerchantName = merchantInfo?.Name,
                MerchantDocument = merchantInfo?.Document,
                HttpMethod = HttpContext.Request.Method,
                Endpoint = HttpContext.Request.Path,
                StatusCode = 200,
                Details = $"Saque {payout.Id} rejeitado. Valor: R$ {payout.Amount / 100m:N2}. Motivo: {req.Reason}",
                ResourceId = payout.Id,
                ResourceType = ApiLogResourceType.Payout
            });

            await Send.OkAsync(new EvaluateCashoutResponse
            {
                Data = new EvaluateCashoutData
                {
                    Id = result.CashoutId ?? payout.Id,
                    Status = result.Status ?? PayoutStatus.Rejected,
                    Message = "O saque foi rejeitado."
                },
                Message = "Saque rejeitado com sucesso."
            }, ct);
        }
    }

    private static string GetApproveStatusMessage(PayoutStatus? status)
    {
        return status switch
        {
            PayoutStatus.Completed => "O saque foi processado e concluído com sucesso.",
            PayoutStatus.Processing => "O saque foi aprovado e está sendo processado.",
            PayoutStatus.Failed => "O saque foi enviado mas falhou no processamento.",
            _ => "O saque foi aprovado."
        };
    }
}
