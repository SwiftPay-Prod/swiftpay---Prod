using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Database;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Admin.Reconciliations.ReadReconciliation;

public sealed class ReadReconciliationEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadReconciliationRequest, ReadReconciliationResponse>
{
    public override void Configure()
    {
        Get("reconciliations/{id:guid}");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ReadReconciliationRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadReconciliationResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var reconciliation = await dbContext.BankReconciliations
            .Include(r => r.Merchant)
            .Include(r => r.RequestedByUser)
            .Include(r => r.CorrectionsAppliedByUser)
            .Include(r => r.Discrepancies)
            .AsNoTracking()
            .OrderBy(r => r.Id)
            .FirstOrDefaultAsync(r => r.Id == req.Id, ct);

        if (reconciliation == null)
        {
            await Send.ResponseAsync(new ReadReconciliationResponse
            {
                Error = new("Reconciliação não encontrada.")
            }, 404, ct);
            return;
        }

        await Send.OkAsync(new ReadReconciliationResponse
        {
            Data = new AdminReconciliationDetails
            {
                Id = reconciliation.Id,
                MerchantId = reconciliation.MerchantId,
                MerchantName = reconciliation.Merchant?.Name ?? "N/A",
                Environment = reconciliation.Environment.ToString(),
                Status = reconciliation.Status.ToString(),
                
                LedgerBalance = reconciliation.LedgerBalance,
                CalculatedBalance = reconciliation.CalculatedBalance,
                BalanceDifference = reconciliation.BalanceDifference,
                
                TotalPaymentsAmount = reconciliation.TotalPaymentsAmount,
                TotalPayoutsAmount = reconciliation.TotalPayoutsAmount,
                TotalFeesAmount = reconciliation.TotalFeesAmount,
                TotalRefundsAmount = reconciliation.TotalRefundsAmount,
                TotalRefundsCount = reconciliation.TotalRefundsCount,
                TotalAdjustmentsAmount = reconciliation.TotalAdjustmentsAmount,
                TotalAdjustmentsCount = reconciliation.TotalAdjustmentsCount,
                TotalLedgerTransactionsCount = reconciliation.TotalLedgerTransactionsCount,
                
                TotalPaymentsCount = reconciliation.TotalPaymentsCount,
                TotalPayoutsCount = reconciliation.TotalPayoutsCount,
                
                TotalDiscrepancies = reconciliation.TotalDiscrepancies,
                CorrectedDiscrepancies = reconciliation.Discrepancies.Count(d => d.Corrected),
                DiscrepanciesWithErrorAmount = reconciliation.DiscrepanciesWithErrorAmount,
                HasDiscrepancies = reconciliation.HasDiscrepancies,
                CorrectionsApplied = reconciliation.CorrectionsApplied,
                
                ErrorMessage = reconciliation.ErrorMessage,
                
                RequestedByUserId = reconciliation.RequestedByUserId,
                RequestedByUserName = reconciliation.RequestedByUser?.Name,
                
                CreatedAt = reconciliation.CreatedAt,
                UpdatedAt = reconciliation.UpdatedAt,
                ProcessingStartedAt = reconciliation.ProcessingStartedAt,
                ProcessingCompletedAt = reconciliation.ProcessingCompletedAt,
                CorrectionsAppliedAt = reconciliation.CorrectionsAppliedAt,
                CorrectionsAppliedByUserId = reconciliation.CorrectionsAppliedByUserId,
                CorrectionsAppliedByUserName = reconciliation.CorrectionsAppliedByUser?.Name,
                CorrectionNotes = reconciliation.CorrectionNotes,
                
                Discrepancies = reconciliation.Discrepancies?.Select(d => new AdminReconciliationDiscrepancy
                {
                    Id = d.Id,
                    Type = d.Type.ToString(),
                    Severity = d.Severity.ToString(),
                    Description = d.Description,
                    PaymentId = d.PaymentId,
                    PayoutId = d.PayoutId,
                    LedgerTransactionId = d.LedgerTransactionId,
                    ExpectedAmount = d.ExpectedAmount,
                    ActualAmount = d.ActualAmount,
                    Difference = d.Difference,
                    SuggestedAction = d.SuggestedAction,
                    Corrected = d.Corrected,
                    CreatedAt = d.CreatedAt
                }).ToList() ?? []
            }
        }, ct);
    }
}
