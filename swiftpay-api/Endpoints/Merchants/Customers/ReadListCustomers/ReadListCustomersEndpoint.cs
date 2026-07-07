using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Enum;
using swiftpay_api.Mappers;

namespace swiftpay_api.Endpoints.Merchants.Customers.ReadListCustomers;

public sealed class ReadListCustomersEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadListCustomersRequest, ReadListCustomersResponse>
{
    public override void Configure()
    {
        Get("{merchantId:guid}/customers");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadListCustomersRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadListCustomersResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var isAdmin = EndpointUtils.IsAdmin(User);
        var merchantQuery = dbContext.Merchants.AsQueryable();
        var merchant = isAdmin
            ? await merchantQuery.Where(m => m.Id == req.MerchantId).OrderBy(m => m.Id).FirstOrDefaultAsync(ct)
            : await merchantQuery.Where(m => m.Id == req.MerchantId && m.UserId == userId).OrderBy(m => m.Id).FirstOrDefaultAsync(ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new ReadListCustomersResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var query = dbContext.Customers
            .Where(c => c.MerchantId == req.MerchantId)
            .AsQueryable();

        if (req.Status.HasValue)
        {
            query = query.Where(c => c.Status == req.Status.Value);
        }

        if (!string.IsNullOrWhiteSpace(req.Search))
        {
            var search = req.Search.ToLower();
            query = query.Where(c =>
                c.Name.ToLower().Contains(search) ||
                c.Email.ToLower().Contains(search) ||
                (c.Document != null && c.Document.Contains(search)));
        }

        var totalItems = await query.CountAsync(ct);

        var customers = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .ToListAsync(ct);

        var customerIds = customers.Select(c => c.Id).ToList();
        var paymentsCountMap = await dbContext.Payments
            .AsNoTracking()
            .Where(p => p.MerchantId == req.MerchantId && p.CustomerId != null && customerIds.Contains(p.CustomerId.Value))
            .GroupBy(p => p.CustomerId)
            .Select(g => new { CustomerId = g.Key!.Value, Count = g.Count() })
            .ToDictionaryAsync(x => x.CustomerId, x => x.Count, ct);

        var items = customers
            .Select(customer =>
            {
                paymentsCountMap.TryGetValue(customer.Id, out var paymentsCount);
                return CustomerMapper.ToMinimalData(customer, paymentsCount);
            })
            .ToList();

        await Send.OkAsync(new ReadListCustomersResponse
        {
            Data = new Paginated<MinimalCustomer>
            {
                Items = items,
                Page = req.Page,
                PageSize = req.PageSize,
                TotalItems = totalItems,
                TotalPages = (int)Math.Ceiling(totalItems / (double)req.PageSize)
            }
        }, ct);
    }
}
