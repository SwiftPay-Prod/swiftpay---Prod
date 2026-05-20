using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;
using safefy_api.Mappers;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Merchants.Credentials.ReadListApiCredentials;

public sealed class ReadListApiCredentialsEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadListApiCredentialsRequest, ReadListApiCredentialsResponse>
{
    public override void Configure()
    {
        Get("{merchantId:guid}/api-credentials");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadListApiCredentialsRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadListApiCredentialsResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        // Verify merchant belongs to user
        var merchant = await dbContext.Merchants
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new ReadListApiCredentialsResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var query = dbContext.MerchantApiCredentials
            .Where(c => c.MerchantId == req.MerchantId);

        // Filter by name
        if (!string.IsNullOrWhiteSpace(req.Name))
        {
            query = query.Where(c => c.Name != null && c.Name.ToLower().Contains(req.Name.ToLower()));
        }

        // Filter by status
        if (req.Status.HasValue)
        {
            query = query.Where(c => c.Status == req.Status.Value);
        }

        // Sorting
        query = req.SortBy?.ToLowerInvariant() switch
        {
            "name" => req.SortOrder?.ToLowerInvariant() == "asc"
                ? query.OrderBy(c => c.Name)
                : query.OrderByDescending(c => c.Name),
            _ => req.SortOrder?.ToLowerInvariant() == "asc"
                ? query.OrderBy(c => c.CreatedAt)
                : query.OrderByDescending(c => c.CreatedAt)
        };

        var totalItems = await query.CountAsync(ct);

        var credentials = await query
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .ToListAsync(ct);

        var items = credentials.Select(ApiCredentialMapper.ToListData).ToList();

        await Send.OkAsync(new ReadListApiCredentialsResponse
        {
            Data = new Paginated<ApiCredentialListData>
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
