using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;
using safefy_api_core.Models;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Merchants.BalanceHistory.ListBalanceHistory;

public sealed class ListBalanceHistoryEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ListBalanceHistoryRequest, ListBalanceHistoryResponse>
{
    public override void Configure()
    {
        Get("{merchantId:guid}/balance-history");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ListBalanceHistoryRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ListBalanceHistoryResponse
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
            await Send.ResponseAsync(new ListBalanceHistoryResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var query = dbContext.BankReconciliations
            .Where(br => br.MerchantId == req.MerchantId)
            .Where(br => br.Status == BankReconciliationStatus.CorrectionsApplied 
                      || br.Status == BankReconciliationStatus.Completed)
            .AsQueryable();

        var totalItems = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(br => br.ProcessingCompletedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .Select(br => new MinimalBalanceHistory
            {
                Id = br.Id,
                Status = br.Status,
                Environment = br.Environment,
                PreviousBalance = br.LedgerBalance,
                NewBalance = br.CalculatedBalance,
                BalanceChange = br.BalanceDifference,
                HasCorrections = br.CorrectionsApplied,
                TotalCorrections = br.TotalDiscrepancies,
                ProcessedAt = br.ProcessingCompletedAt ?? br.CreatedAt,
                CorrectionsAppliedAt = br.CorrectionsAppliedAt
            })
            .ToListAsync(ct);

        await Send.OkAsync(new ListBalanceHistoryResponse
        {
            Data = new Paginated<MinimalBalanceHistory>
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

public sealed class Paginated<T>
{
    public IReadOnlyList<T> Items { get; set; } = Array.Empty<T>();
    public int TotalItems { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}
