using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;
using safefy_api.Mappers;
using safefy_api.Endpoints.Models;
using safefy_api.Endpoints.Merchants.Products;

namespace safefy_api.Endpoints.Merchants.Categories.ReadListCategories;

public sealed class ReadListCategoriesEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadListCategoriesRequest, ReadListCategoriesResponse>
{
    public override void Configure()
    {
        Get("{merchantId:guid}/categories");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadListCategoriesRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadListCategoriesResponse
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
            await Send.ResponseAsync(new ReadListCategoriesResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var query = dbContext.Categories
            .Include(c => c.Products)
            .Where(c => c.MerchantId == req.MerchantId)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(req.Search))
        {
            var search = req.Search.ToLower();
            query = query.Where(c =>
                c.Name.ToLower().Contains(search) ||
                (c.Description != null && c.Description.ToLower().Contains(search)) ||
                (c.ExternalId != null && c.ExternalId.ToLower().Contains(search)));
        }

        if (req.Status.HasValue)
        {
            query = query.Where(c => c.Status == req.Status.Value);
        }

        var totalItems = await query.CountAsync(ct);

        var categories = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .ToListAsync(ct);

        await Send.OkAsync(new ReadListCategoriesResponse
        {
            Data = new Paginated<MinimalCategory>
            {
                Items = categories.Select(CategoryMapper.ToMinimalData).ToList(),
                TotalItems = totalItems,
                Page = req.Page,
                PageSize = req.PageSize,
                TotalPages = (int)Math.Ceiling(totalItems / (double)req.PageSize)
            }
        }, ct);
    }
}
