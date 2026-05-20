using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.Endpoints.Models;
using safefy_api.EndpointsGroups;
using safefy_api.Mappers;
using safefy_api_core.Database;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Merchants.Products.DigitalItems.ReadListDigitalItems;

public sealed class ReadListDigitalItemsEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadListDigitalItemsRequest, ReadListDigitalItemsResponse>
{
    public override void Configure()
    {
        Get("{merchantId:guid}/products/{productId:guid}/digital-items");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadListDigitalItemsRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadListDigitalItemsResponse
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
            await Send.ResponseAsync(new ReadListDigitalItemsResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var product = await dbContext.Products
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(p => p.Id == req.ProductId && p.MerchantId == req.MerchantId, ct);

        if (product == null)
        {
            await Send.ResponseAsync(new ReadListDigitalItemsResponse
            {
                Error = new("Produto não encontrado.")
            }, 404, ct);
            return;
        }

        if (product.Type != ProductType.Digital)
        {
            await Send.ResponseAsync(new ReadListDigitalItemsResponse
            {
                Error = new("Este produto não é digital. Itens digitais só podem ser adicionados a produtos do tipo Digital.")
            }, 400, ct);
            return;
        }

        var query = dbContext.DigitalItems
            .AsNoTracking()
            .Include(di => di.Variant)
            .Where(di => di.ProductId == req.ProductId);

        if (req.VariantId.HasValue)
            query = query.Where(di => di.VariantId == req.VariantId);

        if (req.Status.HasValue)
            query = query.Where(di => di.Status == req.Status);

        var totalItems = await query.CountAsync(ct);
        var totalPages = (int)Math.Ceiling(totalItems / (double)req.PageSize);

        var items = await query
            .OrderByDescending(di => di.CreatedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .Include(di => di.Variant)
            .Include(di => di.DeliveredToOrder)
            .ToListAsync(ct);

        var mappedItems = items.Select(DigitalItemMapper.ToMinimalData).ToList();

        var stats = await dbContext.DigitalItems
            .AsNoTracking()
            .Where(di => di.ProductId == req.ProductId)
            .OrderBy(di => di.Id)
            .GroupBy(di => 1)
            .Select(g => new DigitalItemStats
            {
                TotalItems = g.Count(),
                AvailableItems = g.Count(di => di.Status == DigitalItemStatus.Available),
                DeliveredItems = g.Count(di => di.Status == DigitalItemStatus.Delivered),
                ReservedItems = g.Count(di => di.Status == DigitalItemStatus.Reserved),
                DisabledItems = g.Count(di => di.Status == DigitalItemStatus.Disabled)
            })
            .FirstOrDefaultAsync(ct) ?? new DigitalItemStats();

        var variantIdsWithItems = await dbContext.DigitalItems
            .AsNoTracking()
            .Where(di => di.ProductId == req.ProductId && di.VariantId != null)
            .Select(di => di.VariantId!.Value)
            .Distinct()
            .ToListAsync(ct);

        stats.VariantIdsWithItems = variantIdsWithItems;

        await Send.OkAsync(new ReadListDigitalItemsResponse
        {
            Data = new ReadListDigitalItemsData
            {
                Items = new Paginated<MinimalDigitalItem>
                {
                    Items = mappedItems,
                    TotalItems = totalItems,
                    Page = req.Page,
                    PageSize = req.PageSize,
                    TotalPages = totalPages
                },
                Stats = stats
            }
        }, ct);
    }
}
