using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Admin.Merchants.ReadMerchantAcquirerHistory;

public sealed class ReadMerchantAcquirerHistoryEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadMerchantAcquirerHistoryRequest, ReadMerchantAcquirerHistoryResponse>
{
    public override void Configure()
    {
        Get("merchant/{merchantId:guid}/acquirer-history");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ReadMerchantAcquirerHistoryRequest req, CancellationToken ct)
    {
        var adminId = EndpointUtils.GetUserId(User);
        if (adminId == null)
        {
            await Send.ResponseAsync(new ReadMerchantAcquirerHistoryResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchantExists = await dbContext.Merchants
            .AnyAsync(m => m.Id == req.MerchantId, ct);

        if (!merchantExists)
        {
            await Send.ResponseAsync(new ReadMerchantAcquirerHistoryResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var query = dbContext.MerchantAcquirerChangeHistories
            .Include(h => h.ChangedByUser)
            .Where(h => h.MerchantId == req.MerchantId)
            .OrderByDescending(h => h.CreatedAt);

        var totalItems = await query.CountAsync(ct);

        var items = await query
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .Select(h => new AcquirerHistoryItem
            {
                Id = h.Id,
                Action = h.Action,
                PreviousAcquirerId = h.PreviousAcquirerId,
                PreviousAcquirerName = h.PreviousAcquirerName,
                NewAcquirerId = h.NewAcquirerId,
                NewAcquirerName = h.NewAcquirerName,
                Reason = h.Reason,
                IsLegacyRecord = h.IsLegacyRecord,
                ChangedByUserId = h.ChangedByUserId,
                ChangedByUserName = h.ChangedByUser != null ? h.ChangedByUser.Name : null,
                CreatedAt = h.CreatedAt
            })
            .ToListAsync(ct);

        await Send.OkAsync(new ReadMerchantAcquirerHistoryResponse
        {
            Data = new Paginated<AcquirerHistoryItem>
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
