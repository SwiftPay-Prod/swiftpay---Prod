using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.EndpointsGroups;
using safefy_api.Endpoints.Models;
using safefy_api_core.Database;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Merchants.Products.Stock.ReadListStockMovements;

public sealed class ReadListStockMovementsEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadListStockMovementsRequest, ReadListStockMovementsResponse>
{
    public override void Configure()
    {
        Get("{merchantId:guid}/products/{productId:guid}/stock/movements");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadListStockMovementsRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadListStockMovementsResponse
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
            await Send.ResponseAsync(new ReadListStockMovementsResponse
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
            await Send.ResponseAsync(new ReadListStockMovementsResponse
            {
                Error = new("Produto não encontrado.")
            }, 404, ct);
            return;
        }

        var query = dbContext.StockMovements
            .Where(m => m.ProductId == req.ProductId && m.MerchantId == req.MerchantId);

        if (req.VariantId.HasValue)
        {
            query = query.Where(m => m.VariantId == req.VariantId);
        }

        if (req.Type.HasValue)
        {
            query = query.Where(m => m.Type == req.Type);
        }

        var totalItems = await query.CountAsync(ct);

        var movements = await query
            .Include(m => m.Variant)
            .OrderByDescending(m => m.CreatedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .Select(m => new StockMovementData
            {
                Id = m.Id,
                ProductId = m.ProductId,
                VariantId = m.VariantId,
                VariantName = m.Variant != null ? m.Variant.Name : null,
                Type = m.Type,
                ReferenceType = m.ReferenceType,
                ReferenceId = m.ReferenceId,
                Quantity = m.Quantity,
                BalanceBefore = m.BalanceBefore,
                BalanceAfter = m.BalanceAfter,
                Notes = m.Notes,
                CreatedAt = m.CreatedAt
            })
            .ToListAsync(ct);

        await Send.OkAsync(new ReadListStockMovementsResponse
        {
            Data = new Paginated<StockMovementData>
            {
                Items = movements,
                TotalItems = totalItems,
                Page = req.Page,
                PageSize = req.PageSize,
                TotalPages = (int)Math.Ceiling(totalItems / (double)req.PageSize)
            }
        }, ct);
    }
}
