using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api.Endpoints.Models;
using swiftpay_api.Models.Settings;
using swiftpay_api_core.Utils;
using swiftpay_api.Mappers;

namespace swiftpay_api.Endpoints.Admin.Acquirers.ReadListAcquirers;

public sealed class ReadListAcquirersEndpoint(
    PrimaryDbContext dbContext,
    IOptions<PaymentApiSettings> paymentApiSettings
) : Endpoint<ReadListAcquirersRequest, ReadListAcquirersResponse>
{
    public override void Configure()
    {
        Get("acquirers");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ReadListAcquirersRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadListAcquirersResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        // Build query
        var query = dbContext.Acquirers
            .Include(a => a.MerchantAcquirers)
            .AsQueryable();

        // Filter by IsActive if provided
        if (req.IsActive.HasValue)
        {
            query = query.Where(a => a.IsActive == req.IsActive.Value);
        }

        if (req.ProviderCategory.HasValue)
        {
            query = query.Where(a => a.ProviderCategory == req.ProviderCategory.Value);
        }

        // Filter by Search (name, displayName or code)
        if (!string.IsNullOrWhiteSpace(req.Search))
        {
            var searchLower = req.Search.Trim().ToLower();
            query = query.Where(a =>
                a.Name.ToLower().Contains(searchLower) ||
                (a.DisplayName != null && a.DisplayName.ToLower().Contains(searchLower)) ||
                a.Code.ToLower().Contains(searchLower)
            );
        }

        // Get total count
        var totalItems = await query.CountAsync(ct);

        // Apply pagination and get items
        var acquirers = await query
            .OrderBy(a => a.Name)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .ToListAsync(ct);

        // Map to response
        var items = acquirers
            .Select(acquirer => AcquirerMapper.ToData(acquirer, paymentApiSettings.Value.BaseUrl))
            .ToList();

        await Send.OkAsync(new ReadListAcquirersResponse
        {
            Data = new Paginated<AdminAcquirerData>
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
