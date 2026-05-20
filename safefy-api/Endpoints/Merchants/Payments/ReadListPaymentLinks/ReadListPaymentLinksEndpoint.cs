using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.Endpoints.Models;
using safefy_api.EndpointsGroups;
using safefy_api.Mappers;
using safefy_api_core.Database;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Merchants.Payments.ReadListPaymentLinks;

public sealed class ReadListPaymentLinksEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadListPaymentLinksRequest, ReadListPaymentLinksResponse>
{
    public override void Configure()
    {
        Get("{merchantId:guid}/payment-links");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadListPaymentLinksRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadListPaymentLinksResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .AsNoTracking()
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new ReadListPaymentLinksResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        if (merchant.Status != MerchantStatus.Active)
        {
            await Send.ResponseAsync(new ReadListPaymentLinksResponse
            {
                Error = new("Organização não está ativa.")
            }, 403, ct);
            return;
        }

        var query = dbContext.PaymentLinks
            .AsNoTracking()
            .Include(pl => pl.Payment!)
                .ThenInclude(p => p.Customer)
            .Where(pl => pl.MerchantId == req.MerchantId && (pl.Payment == null || !pl.Payment.SuppressMerchantVisibility));

        if (req.Status.HasValue)
            query = query.Where(pl => pl.Payment != null && pl.Payment.Status == req.Status.Value);

        if (req.Method.HasValue)
        {
            var requestedMethod = req.Method.Value;
            query = query.Where(pl =>
                (pl.Payment != null && pl.Payment.Method == requestedMethod)
                || (pl.Payment == null && pl.EnabledMethods.Contains(requestedMethod.ToString())));
        }

        if (req.StartDate.HasValue)
            query = query.Where(pl => pl.CreatedAt >= req.StartDate.Value);

        if (req.EndDate.HasValue)
            query = query.Where(pl => pl.CreatedAt <= req.EndDate.Value.AddDays(1).AddTicks(-1));

        if (!string.IsNullOrWhiteSpace(req.Search))
        {
            var searchValue = req.Search.Trim();
            var searchLower = searchValue.ToLower();
            var searchSanitized = SanitizeUtils.SanitizeNumeric(searchValue) ?? string.Empty;
            var hasGuid = Guid.TryParse(searchValue, out var searchGuid);
            var hasNumeric = !string.IsNullOrWhiteSpace(searchSanitized);

            query = query.Where(pl =>
                pl.Token.ToLower().Contains(searchLower)
                || (hasGuid && (pl.Id == searchGuid || pl.PaymentId == searchGuid))
                || (pl.Description != null && pl.Description.ToLower().Contains(searchLower))
                || (pl.Payment != null && pl.Payment.Description != null && pl.Payment.Description.ToLower().Contains(searchLower))
                || (pl.Payment != null && pl.Payment.ExternalId != null && pl.Payment.ExternalId.ToLower().Contains(searchLower))
                || (pl.Payment != null && pl.Payment.Customer != null && pl.Payment.Customer.Name.ToLower().Contains(searchLower))
                || (pl.Payment != null && pl.Payment.Customer != null && pl.Payment.Customer.Email != null && pl.Payment.Customer.Email.ToLower().Contains(searchLower))
                || (hasNumeric && pl.Payment != null && pl.Payment.Customer != null && pl.Payment.Customer.Document != null && pl.Payment.Customer.Document.Contains(searchSanitized))
            );
        }

        var totalItems = await query.CountAsync(ct);

        var merchantSettings = await dbContext.MerchantSettings
            .AsNoTracking()
            .Where(ms => ms.MerchantId == req.MerchantId)
            .OrderBy(ms => ms.Id)
            .FirstOrDefaultAsync(ct);

        var platformDbSettings = await dbContext.PlatformSettings
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(ct) ?? new PlatformSettings();

        var links = await query
            .OrderByDescending(pl => pl.CreatedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .ToListAsync(ct);

        var items = links
            .Select(link => PaymentLinkMapper.ToMinimalData(link, platformDbSettings, merchantSettings))
            .ToList();

        await Send.ResponseAsync(new ReadListPaymentLinksResponse
        {
            Data = new Paginated<MinimalPaymentLink>
            {
                Items = items,
                TotalItems = totalItems,
                Page = req.Page,
                PageSize = req.PageSize,
                TotalPages = (int)Math.Ceiling((double)totalItems / req.PageSize)
            }
        }, cancellation: ct);
    }
}
