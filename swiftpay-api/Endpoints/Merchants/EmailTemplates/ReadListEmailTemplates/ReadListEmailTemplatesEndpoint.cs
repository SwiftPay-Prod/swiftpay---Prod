using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.Endpoints.Merchants.EmailTemplates.Shared.Models;
using safefy_api.Endpoints.Models;
using safefy_api.EndpointsGroups;
using safefy_api.Mappers;
using safefy_api_core.Database;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Merchants.EmailTemplates.ReadListEmailTemplates;

public sealed class ReadListEmailTemplatesEndpoint(PrimaryDbContext dbContext)
    : Endpoint<ReadListEmailTemplatesRequest, ReadListEmailTemplatesResponse>
{
    public override void Configure()
    {
        Get("{merchantId:guid}/email-templates");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadListEmailTemplatesRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadListEmailTemplatesResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .AsNoTracking()
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId.Value, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new ReadListEmailTemplatesResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var query = dbContext.MerchantEmailTemplates
            .AsNoTracking()
            .Where(t => t.MerchantId == req.MerchantId);

        if (req.Type.HasValue)
            query = query.Where(t => t.Type == req.Type.Value);

        if (req.Enabled.HasValue)
            query = query.Where(t => t.Enabled == req.Enabled.Value);

        if (!string.IsNullOrWhiteSpace(req.Search))
            query = query.Where(t => t.Name.Contains(req.Search) || t.Subject.Contains(req.Search));

        var totalItems = await query.CountAsync(ct);
        var totalPages = (int)Math.Ceiling(totalItems / (double)req.PageSize);

        var templates = await query
            .OrderByDescending(t => t.UpdatedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .ToListAsync(ct);

        await Send.ResponseAsync(new ReadListEmailTemplatesResponse
        {
            Data = new Paginated<MinimalEmailTemplateData>
            {
                Items = templates.Select(EmailTemplateMapper.ToMinimalData).ToList(),
                TotalItems = totalItems,
                Page = req.Page,
                PageSize = req.PageSize,
                TotalPages = totalPages
            }
        }, 200, ct);
    }
}
