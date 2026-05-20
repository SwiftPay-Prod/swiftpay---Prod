using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.EndpointsGroups;
using safefy_api.Interfaces;
using safefy_api.Models.PaymentApi;
using safefy_api_core.Database;
using safefy_api_core.Models.Database;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Admin.Transactions.ReprocessCompletedTransactionDev;

public sealed class ReprocessCompletedTransactionDevEndpoint(
    PrimaryDbContext dbContext,
    IPaymentApiClient paymentApiClient
) : Endpoint<ReprocessCompletedTransactionDevRequest, ReprocessCompletedTransactionDevResponse>
{
    public override void Configure()
    {
        Post("transactions/{transactionId:guid}/dev/reprocess-completed");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ReprocessCompletedTransactionDevRequest req, CancellationToken ct)
    {
        var role = EndpointUtils.GetUserRole(User);
        if (role != nameof(UserRole.God))
        {
            await Send.ForbiddenAsync(ct);
            return;
        }

        var payment = await dbContext.Payments
            .AsNoTracking()
            .Select(p => new { p.Id, p.MerchantId })
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(p => p.Id == req.TransactionId, ct);

        if (payment == null)
        {
            await Send.ResponseAsync(new ReprocessCompletedTransactionDevResponse
            {
                Error = new("Transação não encontrada.")
            }, 404, ct);
            return;
        }

        var result = await paymentApiClient.ReprocessCompletedTransactionDevAsync(new ReprocessCompletedTransactionDevApiInput
        {
            TransactionId = req.TransactionId,
            MerchantId = payment.MerchantId,
            TargetStatus = req.TargetStatus == AdminReprocessTransactionTargetStatus.Failed
                ? ReprocessTransactionTargetStatus.Failed
                : ReprocessTransactionTargetStatus.Completed
        }, ct);

        if (!result.Success)
        {
            await Send.ResponseAsync(new ReprocessCompletedTransactionDevResponse
            {
                Error = new(result.ErrorMessage ?? "Erro ao reprocessar transação.")
            }, 400, ct);
            return;
        }

        await Send.OkAsync(new ReprocessCompletedTransactionDevResponse
        {
            Data = new AdminReprocessCompletedTransactionDevData
            {
                Id = result.TransactionId ?? req.TransactionId,
                Status = result.Status ?? PaymentStatus.Pending,
                CompletedAt = result.CompletedAt,
                Message = req.TargetStatus == AdminReprocessTransactionTargetStatus.Failed
                    ? "Transação reprocessada como falha com sucesso."
                    : "Transação reprocessada como concluída com sucesso."
            },
            Message = "Fluxo financeiro da transação reprocessado com sucesso."
        }, ct);
    }
}
