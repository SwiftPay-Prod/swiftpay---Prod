using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Admin.Templates.ReadListTemplates;

public sealed class ReadListTemplatesEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadListTemplatesRequest, ReadListTemplatesResponse>
{
    public override void Configure()
    {
        Get("templates");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ReadListTemplatesRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadListTemplatesResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var query = dbContext.CheckoutTemplates.AsQueryable();

        if (req.IsActive.HasValue)
        {
            query = query.Where(t => t.IsActive == req.IsActive.Value);
        }

        // IsFree = true significa FeeMode == null (gratuito)
        // IsFree = false significa FeeMode != null (tem taxa)
        if (req.IsFree.HasValue)
        {
            query = req.IsFree.Value
                ? query.Where(t => t.FeeMode == null)
                : query.Where(t => t.FeeMode != null);
        }

        if (req.Type.HasValue)
        {
            query = query.Where(t => t.Type == req.Type.Value);
        }

        if (!string.IsNullOrWhiteSpace(req.Search))
        {
            var search = req.Search.ToLower();
            query = query.Where(t =>
                t.Name.ToLower().Contains(search) ||
                t.Code.ToLower().Contains(search) ||
                (t.ShortDescription != null && t.ShortDescription.ToLower().Contains(search))
            );
        }

        var totalItems = await query.CountAsync(ct);

        var templates = await query
            .OrderBy(t => t.Name)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .ToListAsync(ct);

        var items = templates.Select(AdminTemplateMapper.ToMinimalData).ToList();

        await Send.OkAsync(new ReadListTemplatesResponse
        {
            Data = new Paginated<AdminMinimalTemplate>
            {
                Items = items,
                TotalItems = totalItems,
                Page = req.Page,
                PageSize = req.PageSize,
                TotalPages = (int)Math.Ceiling(totalItems / (double)req.PageSize)
            }
        }, ct);
    }
}
