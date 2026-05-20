using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;
using safefy_api.Mappers;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Merchants.Products.ReadListProducts;

public sealed class ReadListProductsEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadListProductsRequest, ReadListProductsResponse>
{
    public override void Configure()
    {
        Get("{merchantId:guid}/products");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadListProductsRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadListProductsResponse
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
            await Send.ResponseAsync(new ReadListProductsResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var query = dbContext.Products
            .Include(p => p.Categories)
            .Include(p => p.Variants)
            .Include(p => p.Coupons)
            .Include(p => p.DigitalItems)
            .AsSplitQuery()
            .Where(p => p.MerchantId == req.MerchantId)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(req.Search))
        {
            var search = req.Search.ToLower();
            query = query.Where(p =>
                p.Name.ToLower().Contains(search) ||
                (p.Description != null && p.Description.ToLower().Contains(search)) ||
                (p.Brand != null && p.Brand.ToLower().Contains(search)) ||
                (p.ExternalId != null && p.ExternalId.ToLower().Contains(search)));
        }

        if (req.Status.HasValue)
        {
            query = query.Where(p => p.Status == req.Status.Value);
        }

        if (req.Type.HasValue)
        {
            query = query.Where(p => p.Type == req.Type.Value);
        }

        if (req.CategoryId.HasValue)
        {
            query = query.Where(p => p.Categories.Any(c => c.Id == req.CategoryId.Value));
        }

        var totalItems = await query.CountAsync(ct);

        var products = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .ToListAsync(ct);

        await Send.OkAsync(new ReadListProductsResponse
        {
            Data = new Paginated<MinimalProduct>
            {
                Items = products.Select(ProductMapper.ToMinimalData).ToList(),
                TotalItems = totalItems,
                Page = req.Page,
                PageSize = req.PageSize,
                TotalPages = (int)Math.Ceiling(totalItems / (double)req.PageSize)
            }
        }, ct);
    }
}
