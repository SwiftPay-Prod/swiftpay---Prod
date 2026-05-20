using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;
using safefy_api.Mappers;
using safefy_api.Endpoints.Models;
using safefy_api.Endpoints.Merchants.Products;

namespace safefy_api.Endpoints.Merchants.Variants.ReadListVariants;

public sealed class ReadListVariantsEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadListVariantsRequest, ReadListVariantsResponse>
{
    public override void Configure()
    {
        Get("{merchantId:guid}/products/{productId:guid}/variants");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadListVariantsRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadListVariantsResponse
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
            await Send.ResponseAsync(new ReadListVariantsResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var product = await dbContext.Products
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(p => p.Id == req.ProductId && p.MerchantId == req.MerchantId, ct);

        if (product == null)
        {
            await Send.ResponseAsync(new ReadListVariantsResponse
            {
                Error = new("Produto não encontrado.")
            }, 404, ct);
            return;
        }

        var query = dbContext.Variants
            .Where(v => v.ProductId == req.ProductId)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(req.Search))
        {
            var search = req.Search.ToLower();
            query = query.Where(v =>
                v.Name.ToLower().Contains(search) ||
                (v.SKU != null && v.SKU.ToLower().Contains(search)) ||
                (v.ExternalId != null && v.ExternalId.ToLower().Contains(search)));
        }

        if (req.Status.HasValue)
        {
            query = query.Where(v => v.Status == req.Status.Value);
        }

        var totalItems = await query.CountAsync(ct);

        var variants = await query
            .OrderByDescending(v => v.CreatedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .ToListAsync(ct);

        await Send.OkAsync(new ReadListVariantsResponse
        {
            Data = new Paginated<MinimalVariant>
            {
                Items = variants.Select(VariantMapper.ToMinimalData).ToList(),
                TotalItems = totalItems,
                Page = req.Page,
                PageSize = req.PageSize,
                TotalPages = (int)Math.Ceiling(totalItems / (double)req.PageSize)
            }
        }, ct);
    }
}
