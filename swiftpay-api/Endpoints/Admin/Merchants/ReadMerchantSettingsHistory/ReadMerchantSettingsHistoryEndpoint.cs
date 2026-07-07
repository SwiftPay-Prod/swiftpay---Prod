using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Admin.Merchants.ReadMerchantSettingsHistory;

public sealed class ReadMerchantSettingsHistoryEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadMerchantSettingsHistoryRequest, ReadMerchantSettingsHistoryResponse>
{
    public override void Configure()
    {
        Get("merchant/{merchantId:guid}/settings-history");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ReadMerchantSettingsHistoryRequest req, CancellationToken ct)
    {
        var adminId = EndpointUtils.GetUserId(User);
        if (adminId == null)
        {
            await Send.ResponseAsync(new ReadMerchantSettingsHistoryResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchantExists = await dbContext.Merchants
            .AnyAsync(m => m.Id == req.MerchantId, ct);

        if (!merchantExists)
        {
            await Send.ResponseAsync(new ReadMerchantSettingsHistoryResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var query = dbContext.MerchantSettingsChangeHistories
            .Include(h => h.ChangedByUser)
            .Where(h => h.MerchantId == req.MerchantId);

        if (req.Category.HasValue)
        {
            query = query.Where(h => h.Category == req.Category.Value);
        }

        query = query.OrderByDescending(h => h.CreatedAt);

        var totalItems = await query.CountAsync(ct);

        var items = await query
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .Select(h => new SettingsHistoryItem
            {
                Id = h.Id,
                Category = h.Category,
                PreviousValuesJson = h.PreviousValuesJson,
                NewValuesJson = h.NewValuesJson,
                ChangedFields = h.ChangedFields,
                Description = h.Description,
                Reason = h.Reason,
                IsLegacyRecord = h.IsLegacyRecord,
                ChangedByUserId = h.ChangedByUserId,
                ChangedByUserName = h.ChangedByUser != null ? h.ChangedByUser.Name : null,
                CreatedAt = h.CreatedAt
            })
            .ToListAsync(ct);

        await Send.OkAsync(new ReadMerchantSettingsHistoryResponse
        {
            Data = new Paginated<SettingsHistoryItem>
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
