using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Models.Database;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Utils;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Models.Enum;
using swiftpay_api.Mappers;

namespace swiftpay_api.Endpoints.Merchants.Orders.ReadListOrders;

public sealed class ReadListOrdersEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadListOrdersRequest, ReadListOrdersResponse>
{
    public override void Configure()
    {
        Get("{merchantId:guid}/orders");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadListOrdersRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadListOrdersResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .AsNoTracking()
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new ReadListOrdersResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        if (merchant.Status != MerchantStatus.Active)
        {
            await Send.ResponseAsync(new ReadListOrdersResponse
            {
                Error = new("Organização não está ativa.")
            }, 403, ct);
            return;
        }

        var query = dbContext.Orders
            .AsNoTracking()
            .Include(o => o.Items)
            .Include(o => o.Customer)
            .Include(o => o.Payment)
            .Where(o => o.MerchantId == req.MerchantId);

        if (req.Status.HasValue)
            query = query.Where(o => o.Status == req.Status.Value);

        if (req.FulfillmentStatus.HasValue)
            query = query.Where(o => o.FulfillmentStatus == req.FulfillmentStatus.Value);

        if (req.StartDate.HasValue)
            query = query.Where(o => o.CreatedAt >= req.StartDate.Value);

        if (req.EndDate.HasValue)
            query = query.Where(o => o.CreatedAt <= req.EndDate.Value.AddDays(1).AddTicks(-1));

        if (!string.IsNullOrWhiteSpace(req.Search))
        {
            var searchValue = req.Search.Trim();
            var searchLower = searchValue.ToLower();
            var searchSanitized = SanitizeUtils.SanitizeNumeric(searchValue) ?? "";
            var hasGuid = Guid.TryParse(searchValue, out var searchGuid);
            var hasNumeric = !string.IsNullOrEmpty(searchSanitized);

            query = query.Where(o =>
                (hasGuid && (o.Id == searchGuid || (o.Payment != null && o.Payment.Id == searchGuid))) ||
                (o.OrderNumber != null && o.OrderNumber.ToLower().Contains(searchLower)) ||
                (o.Customer != null && o.Customer.Name.ToLower().Contains(searchLower)) ||
                (o.Customer != null && o.Customer.Email != null && o.Customer.Email.ToLower().Contains(searchLower)) ||
                (hasNumeric && o.Customer != null && o.Customer.Document != null && o.Customer.Document.Contains(searchSanitized))
            );
        }

        var totalItems = await query.CountAsync(ct);

        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .ToListAsync(ct);

        var items = orders.Select(OrderMapper.ToMinimalData).ToList();

        await Send.ResponseAsync(new ReadListOrdersResponse
        {
            Data = new Paginated<MinimalOrder>
            {
                Items = items,
                TotalItems = totalItems,
                Page = req.Page,
                PageSize = req.PageSize,
                TotalPages = (int)Math.Ceiling((double)totalItems / req.PageSize)
            }
        }, cancellation: ct);
    }
}
