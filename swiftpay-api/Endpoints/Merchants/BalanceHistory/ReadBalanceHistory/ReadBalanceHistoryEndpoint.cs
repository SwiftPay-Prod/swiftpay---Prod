using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Merchants.BalanceHistory.ReadBalanceHistory;

public sealed class ReadBalanceHistoryEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadBalanceHistoryRequest, ReadBalanceHistoryResponse>
{
    public override void Configure()
    {
        Get("{merchantId:guid}/balance-history/{reconciliationId:guid}");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadBalanceHistoryRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadBalanceHistoryResponse
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
            await Send.ResponseAsync(new ReadBalanceHistoryResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var reconciliation = await dbContext.BankReconciliations
            .Include(br => br.Discrepancies)
            .OrderBy(br => br.Id)
            .FirstOrDefaultAsync(br => br.Id == req.ReconciliationId && br.MerchantId == req.MerchantId, ct);

        if (reconciliation == null)
        {
            await Send.ResponseAsync(new ReadBalanceHistoryResponse
            {
                Error = new("Verificação de saldo não encontrada.")
            }, 404, ct);
            return;
        }

        if (reconciliation.Status != BankReconciliationStatus.CorrectionsApplied 
            && reconciliation.Status != BankReconciliationStatus.Completed)
        {
            await Send.ResponseAsync(new ReadBalanceHistoryResponse
            {
                Error = new("Esta verificação ainda não foi concluída.")
            }, 400, ct);
            return;
        }

        var details = new BalanceHistoryDetails
        {
            Id = reconciliation.Id,
            Status = reconciliation.Status,
            Environment = reconciliation.Environment,
            Balance = new BalanceSummary
            {
                PreviousBalance = reconciliation.LedgerBalance,
                NewBalance = reconciliation.CalculatedBalance,
                BalanceChange = reconciliation.BalanceDifference,
                IsPositiveChange = reconciliation.BalanceDifference >= 0
            },
            Transactions = new TransactionSummary
            {
                TotalPayments = reconciliation.TotalPaymentsCount,
                TotalPaymentsAmount = reconciliation.TotalPaymentsAmount,
                TotalPayouts = reconciliation.TotalPayoutsCount,
                TotalPayoutsAmount = reconciliation.TotalPayoutsAmount,
                TotalRefunds = reconciliation.TotalRefundsCount,
                TotalRefundsAmount = reconciliation.TotalRefundsAmount,
                TotalFees = reconciliation.TotalFeesAmount,
                TotalTransactionsAnalyzed = reconciliation.TotalLedgerTransactionsCount
            },
            Corrections = reconciliation.Discrepancies
                .OrderByDescending(d => d.Severity)
                .ThenByDescending(d => Math.Abs(d.Difference))
                .Select(d => new BalanceCorrection
                {
                    Id = d.Id,
                    Type = d.Type.ToString(),
                    TypeLabel = GetDiscrepancyTypeLabel(d.Type),
                    Severity = d.Severity.ToString(),
                    SeverityLabel = GetSeverityLabel(d.Severity),
                    Description = d.Description,
                    SuggestedAction = d.SuggestedAction,
                    ExpectedAmount = d.ExpectedAmount,
                    ActualAmount = d.ActualAmount,
                    Difference = d.Difference,
                    WasCorrected = d.Corrected,
                    CorrectedAt = d.CorrectedAt,
                    CorrectionDescription = d.CorrectionDescription
                })
                .ToList(),
            ProcessedAt = reconciliation.ProcessingCompletedAt ?? reconciliation.CreatedAt,
            CorrectionsAppliedAt = reconciliation.CorrectionsAppliedAt
        };

        await Send.OkAsync(new ReadBalanceHistoryResponse
        {
            Data = details
        }, ct);
    }

    private static string GetDiscrepancyTypeLabel(ReconciliationDiscrepancyType type) => type switch
    {
        ReconciliationDiscrepancyType.PaymentNotInLedger => "Pagamento não registrado",
        ReconciliationDiscrepancyType.PayoutNotInLedger => "Saque não registrado",
        ReconciliationDiscrepancyType.RefundNotInLedger => "Estorno não registrado",
        ReconciliationDiscrepancyType.MissingReversal => "Reversão faltante",
        ReconciliationDiscrepancyType.OrphanLedgerEntry => "Registro sem referência",
        ReconciliationDiscrepancyType.AmountMismatch => "Diferença de valor",
        ReconciliationDiscrepancyType.FeeMismatch => "Diferença de taxa",
        ReconciliationDiscrepancyType.DuplicateLedgerEntry => "Registro duplicado",
        ReconciliationDiscrepancyType.BalanceMismatch => "Diferença de saldo",
        _ => type.ToString()
    };

    private static string GetSeverityLabel(ReconciliationDiscrepancySeverity severity) => severity switch
    {
        ReconciliationDiscrepancySeverity.Info => "Informação",
        ReconciliationDiscrepancySeverity.Warning => "Atenção",
        ReconciliationDiscrepancySeverity.Error => "Erro",
        ReconciliationDiscrepancySeverity.Critical => "Crítico",
        _ => severity.ToString()
    };
}
