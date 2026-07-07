using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api.Mappers;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Settings;

namespace swiftpay_api.Endpoints.Merchants.Checkouts.ReadListCheckouts;

public sealed class ReadListCheckoutsEndpoint(
    PrimaryDbContext dbContext,
    IOptions<PlatformSettingsOptions> platformSettings
) : Endpoint<ReadListCheckoutsRequest, ReadListCheckoutsResponse>
{
    public override void Configure()
    {
        Get("{merchantId:guid}/checkouts");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadListCheckoutsRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadListCheckoutsResponse
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
            await Send.ResponseAsync(new ReadListCheckoutsResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var query = dbContext.Checkouts
            .Include(c => c.CheckoutTemplate)
            .Include(c => c.CheckoutProducts)
            .Include(c => c.Coupons)
            .Include(c => c.Orders)
            .AsSplitQuery()
            .Where(c => c.MerchantId == req.MerchantId)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(req.Search))
        {
            var search = req.Search.ToLower();
            query = query.Where(c =>
                c.Name.ToLower().Contains(search) ||
                c.Slug.ToLower().Contains(search) ||
                (c.Description != null && c.Description.ToLower().Contains(search)));
        }

        if (req.Status.HasValue)
        {
            query = query.Where(c => c.Status == req.Status.Value);
        }

        if (req.TemplateType.HasValue)
        {
            query = query.Where(c => c.CheckoutTemplate != null && c.CheckoutTemplate.Type == req.TemplateType.Value);
        }

        var totalItems = await query.CountAsync(ct);

        var checkouts = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .ToListAsync(ct);

        var checkoutBaseUrl = platformSettings.Value.CheckoutBaseUrl;

        await Send.OkAsync(new ReadListCheckoutsResponse
        {
            Data = new Paginated<MinimalCheckout>
            {
                Items = checkouts.Select(c => CheckoutMapper.ToMinimalData(c, checkoutBaseUrl)).ToList(),
                TotalItems = totalItems,
                Page = req.Page,
                PageSize = req.PageSize,
                TotalPages = (int)Math.Ceiling(totalItems / (double)req.PageSize)
            }
        }, ct);
    }
}
