using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api.EndpointsGroups;
using swiftpay_api.Interfaces;
using swiftpay_api.Models.PaymentApi;
using swiftpay_api_core.Database;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Admin.Cashouts.ReprocessCompletedCashoutDev;

public sealed class ReprocessCompletedCashoutDevEndpoint(
    PrimaryDbContext dbContext,
    IPaymentApiClient paymentApiClient
) : Endpoint<ReprocessCompletedCashoutDevRequest, ReprocessCompletedCashoutDevResponse>
{
    public override void Configure()
    {
        Post("cashouts/{cashoutId:guid}/dev/reprocess-completed");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ReprocessCompletedCashoutDevRequest req, CancellationToken ct)
    {
        var role = EndpointUtils.GetUserRole(User);
        if (role != nameof(UserRole.God))
        {
            await Send.ForbiddenAsync(ct);
            return;
        }

        var payout = await dbContext.Payouts
            .AsNoTracking()
            .Select(p => new { p.Id, p.MerchantId })
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(p => p.Id == req.CashoutId, ct);

        if (payout == null)
        {
            await Send.ResponseAsync(new ReprocessCompletedCashoutDevResponse
            {
                Error = new("Saque não encontrado.")
            }, 404, ct);
            return;
        }

        var result = await paymentApiClient.ReprocessCompletedCashoutDevAsync(new ReprocessCompletedCashoutDevApiInput
        {
            CashoutId = req.CashoutId,
            MerchantId = payout.MerchantId,
            TargetStatus = req.TargetStatus switch
            {
                AdminReprocessCashoutTargetStatus.Failed => ReprocessCashoutTargetStatus.Failed,
                AdminReprocessCashoutTargetStatus.Rejected => ReprocessCashoutTargetStatus.Rejected,
                _ => ReprocessCashoutTargetStatus.Completed
            }
        }, ct);

        if (!result.Success)
        {
            await Send.ResponseAsync(new ReprocessCompletedCashoutDevResponse
            {
                Error = new(result.ErrorMessage ?? "Erro ao reprocessar saque.")
            }, 400, ct);
            return;
        }

        await Send.OkAsync(new ReprocessCompletedCashoutDevResponse
        {
            Data = new AdminReprocessCompletedCashoutDevData
            {
                Id = result.CashoutId ?? req.CashoutId,
                Status = result.Status ?? PayoutStatus.Processing,
                CompletedAt = result.CompletedAt,
                EndToEndId = result.EndToEndId,
                AcquirerTransactionId = result.AcquirerTransactionId,
                Message = req.TargetStatus switch
                {
                    AdminReprocessCashoutTargetStatus.Failed => "Saque reprocessado como falha com sucesso.",
                    AdminReprocessCashoutTargetStatus.Rejected => "Saque reprocessado como rejeitado com sucesso.",
                    _ => "Saque reprocessado como concluído com sucesso."
                }
            },
            Message = "Fluxo financeiro do saque reprocessado com sucesso."
        }, ct);
    }
}
