using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Admin.Reconciliations.ApplyCorrections;

public sealed class ApplyCorrectionsEndpoint(
    PrimaryDbContext dbContext,
    IBankReconciliationService reconciliationService,
    ILedgerService ledgerService
) : Endpoint<ApplyCorrectionsRequest, ApplyCorrectionsResponse>
{
    public override void Configure()
    {
        Post("reconciliations/{id:guid}/apply");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ApplyCorrectionsRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ApplyCorrectionsResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var reconciliation = await dbContext.BankReconciliations
            .Include(r => r.Discrepancies)
            .OrderBy(r => r.Id)
            .FirstOrDefaultAsync(r => r.Id == req.Id, ct);

        if (reconciliation == null)
        {
            await Send.ResponseAsync(new ApplyCorrectionsResponse
            {
                Error = new("Reconciliação não encontrada.")
            }, 404, ct);
            return;
        }

        if (reconciliation.Status != BankReconciliationStatus.CompletedWithDiscrepancies)
        {
            await Send.ResponseAsync(new ApplyCorrectionsResponse
            {
                Error = new("A reconciliação precisa estar concluída com divergências para aplicar correções.")
            }, 400, ct);
            return;
        }

        if (reconciliation.CorrectionsApplied)
        {
            await Send.ResponseAsync(new ApplyCorrectionsResponse
            {
                Error = new("As correções já foram aplicadas nesta reconciliação.")
            }, 400, ct);
            return;
        }

        if (!reconciliation.HasDiscrepancies)
        {
            await Send.ResponseAsync(new ApplyCorrectionsResponse
            {
                Error = new("Não há divergências para corrigir nesta reconciliação.")
            }, 400, ct);
            return;
        }

        var result = await reconciliationService.ApplyCorrectionsAsync(req.Id, userId.Value, null);

        if (result == null || !result.Success || result.Reconciliation == null)
        {
            await Send.ResponseAsync(new ApplyCorrectionsResponse
            {
                Error = new(result?.ErrorMessage ?? "Erro ao aplicar correções.")
            }, 500, ct);
            return;
        }

        var balanceInfo = await ledgerService.GetMerchantBalanceInfoAsync(reconciliation.MerchantId);

        var appliedReconciliation = result.Reconciliation;

        await Send.OkAsync(new ApplyCorrectionsResponse
        {
            Data = new ApplyCorrectionsData
            {
                Id = appliedReconciliation.Id,
                Success = appliedReconciliation.CorrectionsApplied,
                CorrectionsAppliedCount = appliedReconciliation.Discrepancies?.Count(d => d.Corrected) ?? 0,
                TotalAmountAdjusted = Math.Abs(appliedReconciliation.BalanceDifference),
                NewBalance = balanceInfo.Available,
                AppliedAt = appliedReconciliation.CorrectionsAppliedAt ?? DateTime.UtcNow
            },
            Message = "Correções aplicadas com sucesso."
        }, ct);
    }
}
