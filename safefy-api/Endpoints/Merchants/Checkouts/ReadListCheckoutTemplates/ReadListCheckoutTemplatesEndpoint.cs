using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;
using safefy_api.Mappers;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Merchants.Checkouts.ReadListCheckoutTemplates;

public sealed class ReadListCheckoutTemplatesEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadListCheckoutTemplatesRequest, ReadListCheckoutTemplatesResponse>
{
    public override void Configure()
    {
        Get("{merchantId:guid}/checkout-templates");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadListCheckoutTemplatesRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadListCheckoutTemplatesResponse
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
            await Send.ResponseAsync(new ReadListCheckoutTemplatesResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var query = dbContext.CheckoutTemplates
            .Where(t => t.IsActive)
            .AsQueryable();

        if (req.Type.HasValue)
        {
            query = query.Where(t => t.Type == req.Type.Value);
        }

        var totalItems = await query.CountAsync(ct);

        var templates = await query
            .OrderBy(t => t.Type)
            .ThenBy(t => t.Name)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .ToListAsync(ct);

        await Send.OkAsync(new ReadListCheckoutTemplatesResponse
        {
            Data = new Paginated<CheckoutTemplateData>
            {
                Items = templates.Select(CheckoutMapper.ToTemplateData).ToList(),
                TotalItems = totalItems,
                Page = req.Page,
                PageSize = req.PageSize,
                TotalPages = (int)Math.Ceiling(totalItems / (double)req.PageSize)
            }
        }, ct);
    }
}
