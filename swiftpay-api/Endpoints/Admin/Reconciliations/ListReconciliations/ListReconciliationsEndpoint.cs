using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api.Endpoints.Models;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Database;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Admin.Reconciliations.ListReconciliations;

public sealed class ListReconciliationsEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ListReconciliationsRequest, ListReconciliationsResponse>
{
    public override void Configure()
    {
        Get("reconciliations");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ListReconciliationsRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ListReconciliationsResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var query = dbContext.BankReconciliations
            .Include(r => r.Merchant)
            .Include(r => r.RequestedByUser)
            .Include(r => r.Discrepancies)
            .AsNoTracking();

        if (req.MerchantId.HasValue)
        {
            query = query.Where(r => r.MerchantId == req.MerchantId.Value);
        }

        if (req.OnlyWithProblems)
        {
            query = query.Where(r => r.HasDiscrepancies || r.Status == BankReconciliationStatus.Failed);
        }

        if (req.Status.HasValue)
        {
            query = query.Where(r => r.Status == req.Status.Value);
        }

        var totalItems = await query.CountAsync(ct);

        var reconciliations = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .ToListAsync(ct);

        var items = reconciliations.Select(r => new AdminMinimalReconciliation
        {
            Id = r.Id,
            MerchantId = r.MerchantId,
            MerchantName = r.Merchant?.Name ?? "N/A",
            Environment = r.Environment.ToString(),
            Status = r.Status.ToString(),
            LedgerBalance = r.LedgerBalance,
            CalculatedBalance = r.CalculatedBalance,
            BalanceDifference = r.BalanceDifference,
            TotalDiscrepancies = r.TotalDiscrepancies,
            CorrectedDiscrepancies = r.Discrepancies.Count(d => d.Corrected),
            HasDiscrepancies = r.HasDiscrepancies,
            CorrectionsApplied = r.CorrectionsApplied,
            RequestedByUserName = r.RequestedByUser?.Name,
            CreatedAt = r.CreatedAt,
            ProcessingCompletedAt = r.ProcessingCompletedAt
        }).ToList();

        await Send.OkAsync(new ListReconciliationsResponse
        {
            Data = new Paginated<AdminMinimalReconciliation>
            {
                Items = items,
                TotalItems = totalItems,
                Page = req.Page,
                PageSize = req.PageSize,
                TotalPages = (int)Math.Ceiling(totalItems / (double)req.PageSize)
            }
        }, ct);
    }
}
