using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api_payment.Documentation;
using safefy_api_payment.Endpoints.Customers.Create;
using safefy_api_payment.EndpointsGroups;
using safefy_api_payment.Endpoints.Models;
using safefy_api_payment.Endpoints.Utils;
using safefy_api_payment.Mappers;

namespace safefy_api_payment.Endpoints.Customers.List;

public sealed class ListCustomersEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ListCustomersRequest, ListCustomersResponse>
{
    public override void Configure()
    {
        Get("");
        Group<CustomersGroup>();
        Description(d => d
            .WithName("ListarClientes")
            .WithSummary("Lista todos os clientes")
            .WithDescription(EndpointDescriptions.Customers.List)
            .Produces<ListCustomersResponse>(200, "application/json")
            .Produces<BaseResponse>(401, "application/json"));
    }

    public override async Task HandleAsync(ListCustomersRequest req, CancellationToken ct)
    {
        var merchantId = PaymentEndpointUtils.GetMerchantId(User);
        var environment = PaymentEndpointUtils.GetEnvironment(User);

        if (merchantId == null || !environment.HasValue)
        {
            await Send.ResponseAsync(new ListCustomersResponse
            {
                Error = new ApiErrorResponse("Token inválido.", "invalid_token")
            }, 401, cancellation: ct);
            return;
        }

        var page = Math.Max(1, req.Page);
        var pageSize = Math.Clamp(req.PageSize, 1, 100);

        var query = dbContext.Customers
            .Where(c => c.MerchantId == merchantId)
            .AsQueryable();

        if (req.Status.HasValue)
        {
            query = query.Where(c => c.Status == req.Status.Value);
        }

        if (req.DocumentType.HasValue)
        {
            query = query.Where(c => c.DocumentType == req.DocumentType.Value);
        }

        if (!string.IsNullOrEmpty(req.Search))
        {
            var search = req.Search.ToLower();
            query = query.Where(c => 
                c.Name.ToLower().Contains(search) || 
                c.Email.ToLower().Contains(search) ||
                (c.Document != null && c.Document.Contains(search)));
        }

        if (!string.IsNullOrEmpty(req.ExternalId))
        {
            query = query.Where(c => c.ExternalId == req.ExternalId);
        }

        if (req.StartDate.HasValue)
        {
            var startDateUtc = req.StartDate.Value.Kind == DateTimeKind.Utc
                ? req.StartDate.Value
                : DateTime.SpecifyKind(req.StartDate.Value, DateTimeKind.Utc);
            query = query.Where(c => c.CreatedAt >= startDateUtc);
        }

        if (req.EndDate.HasValue)
        {
            var endDateUtc = req.EndDate.Value.Kind == DateTimeKind.Utc
                ? req.EndDate.Value
                : DateTime.SpecifyKind(req.EndDate.Value, DateTimeKind.Utc);
            query = query.Where(c => c.CreatedAt <= endDateUtc);
        }

        var totalItems = await query.CountAsync(ct);

        var customers = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var customersData = customers.Select(CustomerMapper.ToData).ToList();

        await Send.ResponseAsync(new ListCustomersResponse
        {
            Data = new PaginatedResponse<CustomerData>
            {
                Items = customersData,
                Page = page,
                PageSize = pageSize,
                TotalItems = totalItems
            }
        }, 200, cancellation: ct);
    }
}
