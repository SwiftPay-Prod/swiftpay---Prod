using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;
using safefy_api.Mappers;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Merchants.Coupons.ReadListCoupons;

public sealed class ReadListCouponsEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadListCouponsRequest, ReadListCouponsResponse>
{
    public override void Configure()
    {
        Get("{merchantId:guid}/coupons");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadListCouponsRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadListCouponsResponse
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
            await Send.ResponseAsync(new ReadListCouponsResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var query = dbContext.Coupons
            .Include(c => c.Products)
            .Include(c => c.Checkouts)
            .AsSplitQuery()
            .Where(c => c.MerchantId == req.MerchantId)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(req.Search))
        {
            var search = req.Search.ToLower();
            query = query.Where(c =>
                c.Code.ToLower().Contains(search) ||
                (c.Name != null && c.Name.ToLower().Contains(search)) ||
                (c.Description != null && c.Description.ToLower().Contains(search)));
        }

        if (req.Status.HasValue)
        {
            query = query.Where(c => c.Status == req.Status.Value);
        }

        if (req.DiscountType.HasValue)
        {
            query = query.Where(c => c.DiscountType == req.DiscountType.Value);
        }

        if (req.ApplyToAllProducts.HasValue)
        {
            query = query.Where(c => c.ApplyToAllProducts == req.ApplyToAllProducts.Value);
        }

        var totalItems = await query.CountAsync(ct);

        var coupons = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .ToListAsync(ct);

        await Send.OkAsync(new ReadListCouponsResponse
        {
            Data = new Paginated<MinimalCoupon>
            {
                Items = coupons.Select(CouponMapper.ToMinimalData).ToList(),
                TotalItems = totalItems,
                Page = req.Page,
                PageSize = req.PageSize,
                TotalPages = (int)Math.Ceiling(totalItems / (double)req.PageSize)
            }
        }, ct);
    }
}
