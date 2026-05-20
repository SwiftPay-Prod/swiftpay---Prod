using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api.Endpoints.Models;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Merchants.AutomaticCashouts.ReadListLogs;

public sealed class ReadListLogsEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadListLogsRequest, ReadListLogsResponse>
{
    public override void Configure()
    {
        Get("{merchantId:guid}/automatic-cashouts/logs");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadListLogsRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadListLogsResponse
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
            await Send.ResponseAsync(new ReadListLogsResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var query = dbContext.AutomaticCashoutLogs
            .Where(l => l.MerchantId == req.MerchantId)
            .AsQueryable();

        if (req.Status.HasValue)
            query = query.Where(l => l.Status == req.Status.Value);

        query = query.OrderByDescending(l => l.CreatedAt);

        var totalCount = await query.CountAsync(ct);
        var totalPages = (int)Math.Ceiling(totalCount / (double)req.PageSize);

        var logs = await query
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .Select(l => new MerchantAutomaticCashoutLogData
            {
                Id = l.Id,
                Environment = l.Environment,
                AmountAttempted = l.AmountAttempted,
                NetAmount = l.NetAmount,
                Status = l.Status,
                Message = l.Message,
                PayoutId = l.PayoutId,
                CreatedAt = l.CreatedAt
            })
            .ToListAsync(ct);

        await Send.OkAsync(new ReadListLogsResponse
        {
            Data = new Paginated<MerchantAutomaticCashoutLogData>
            {
                Items = logs,
                TotalItems = totalCount,
                Page = req.Page,
                PageSize = req.PageSize,
                TotalPages = totalPages
            }
        }, ct);
    }
}
