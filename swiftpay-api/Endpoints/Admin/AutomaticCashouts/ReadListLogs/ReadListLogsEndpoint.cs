using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Admin.AutomaticCashouts.ReadListLogs;

public sealed class ReadListLogsEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadListLogsRequest, ReadListLogsResponse>
{
    public override void Configure()
    {
        Get("automatic-cashouts/logs");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ReadListLogsRequest req, CancellationToken ct)
    {
        var adminId = EndpointUtils.GetUserId(User);
        if (adminId == null)
        {
            await Send.ResponseAsync(new ReadListLogsResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var query = dbContext.AutomaticCashoutLogs
            .Include(l => l.Merchant)
            .AsQueryable();

        if (req.MerchantId.HasValue)
            query = query.Where(l => l.MerchantId == req.MerchantId.Value);

        if (req.PlatformOnly == true)
            query = query.Where(l => l.MerchantId == null);

        if (req.Status.HasValue)
            query = query.Where(l => l.Status == req.Status.Value);

        if (req.Environment.HasValue)
            query = query.Where(l => l.Environment == req.Environment.Value);

        query = query.OrderByDescending(l => l.CreatedAt);

        var totalCount = await query.CountAsync(ct);
        var totalPages = (int)Math.Ceiling(totalCount / (double)req.PageSize);

        var logs = await query
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .Select(l => new AdminAutomaticCashoutLogData
            {
                Id = l.Id,
                MerchantId = l.MerchantId,
                MerchantName = l.Merchant != null ? l.Merchant.Name : null,
                Environment = l.Environment,
                AmountAttempted = l.AmountAttempted,
                NetAmount = l.NetAmount,
                Status = l.Status,
                Message = l.Message,
                TechnicalDetails = l.TechnicalDetails,
                PayoutId = l.PayoutId,
                CreatedAt = l.CreatedAt
            })
            .ToListAsync(ct);

        await Send.OkAsync(new ReadListLogsResponse
        {
            Data = new Paginated<AdminAutomaticCashoutLogData>
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
