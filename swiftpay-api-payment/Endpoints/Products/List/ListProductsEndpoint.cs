using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api_payment.Documentation;
using safefy_api_payment.EndpointsGroups;
using safefy_api_payment.Endpoints.Models;
using safefy_api_payment.Endpoints.Utils;
using safefy_api_payment.Mappers;

namespace safefy_api_payment.Endpoints.Products.List;

public sealed class ListProductsEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ListProductsRequest, ListProductsResponse>
{
    public override void Configure()
    {
        Get("");
        Group<ProductsGroup>();
        Description(d => d
            .WithName("ListarProdutos")
            .WithSummary("Lista todos os produtos")
            .WithDescription(EndpointDescriptions.Products.List)
            .Produces<ListProductsResponse>(200, "application/json")
            .Produces<BaseResponse>(401, "application/json"));
    }

    public override async Task HandleAsync(ListProductsRequest req, CancellationToken ct)
    {
        var merchantId = PaymentEndpointUtils.GetMerchantId(User);

        if (merchantId == null)
        {
            await Send.ResponseAsync(new ListProductsResponse
            {
                Error = new ApiErrorResponse("Token inválido.", "invalid_token")
            }, 401, cancellation: ct);
            return;
        }

        var page = Math.Max(1, req.Page);
        var pageSize = Math.Clamp(req.PageSize, 1, 100);

        var query = dbContext.Products
            .Include(p => p.Categories)
            .Include(p => p.Variants)
            .Where(p => p.MerchantId == merchantId)
            .AsQueryable();

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

        if (!string.IsNullOrEmpty(req.Search))
        {
            var search = req.Search.ToLower();
            query = query.Where(p =>
                p.Name.ToLower().Contains(search) ||
                (p.Description != null && p.Description.ToLower().Contains(search)));
        }

        if (!string.IsNullOrEmpty(req.ExternalId))
        {
            query = query.Where(p => p.ExternalId == req.ExternalId);
        }

        if (req.StartDate.HasValue)
        {
            var startDateUtc = req.StartDate.Value.Kind == DateTimeKind.Utc
                ? req.StartDate.Value
                : DateTime.SpecifyKind(req.StartDate.Value, DateTimeKind.Utc);
            query = query.Where(p => p.CreatedAt >= startDateUtc);
        }

        if (req.EndDate.HasValue)
        {
            var endDateUtc = req.EndDate.Value.Kind == DateTimeKind.Utc
                ? req.EndDate.Value
                : DateTime.SpecifyKind(req.EndDate.Value, DateTimeKind.Utc);
            query = query.Where(p => p.CreatedAt <= endDateUtc);
        }

        var totalItems = await query.CountAsync(ct);

        var products = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var productsData = products.Select(ProductMapper.ToData).ToList();

        await Send.ResponseAsync(new ListProductsResponse
        {
            Data = new PaginatedResponse<ProductData>
            {
                Items = productsData,
                Page = page,
                PageSize = pageSize,
                TotalItems = totalItems
            }
        }, 200, cancellation: ct);
    }
}
