using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_payment.Endpoints.Models;
using swiftpay_api_payment.Endpoints.Utils;
using swiftpay_api_payment.EndpointsGroups;

namespace swiftpay_api_payment.Endpoints.Orders.List;

public sealed class ListOrdersEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ListOrdersRequest, ListOrdersResponse>
{
    public override void Configure()
    {
        Get("");
        Group<OrdersGroup>();
    }

    public override async Task HandleAsync(ListOrdersRequest req, CancellationToken ct)
    {
        var merchantId = PaymentEndpointUtils.GetMerchantId(User);
        var environment = PaymentEndpointUtils.GetEnvironment(User);

        if (merchantId == null || !environment.HasValue)
        {
            await Send.ResponseAsync(new ListOrdersResponse
            {
                Error = new ApiErrorResponse("Token inválido.", "invalid_token")
            }, 401, ct);
            return;
        }



        var query = dbContext.Orders
            .Include(o => o.Customer)
            .Include(o => o.Items)
            .Include(o => o.Payment)
            .Where(o => o.MerchantId == merchantId)
            .AsQueryable();

        if (req.Status.HasValue)
        {
            query = query.Where(o => o.Status == req.Status.Value);
        }

        if (req.FulfillmentStatus.HasValue)
        {
            query = query.Where(o => o.FulfillmentStatus == req.FulfillmentStatus.Value);
        }

        if (req.CustomerId.HasValue)
        {
            query = query.Where(o => o.CustomerId == req.CustomerId.Value);
        }

        var totalItems = await query.CountAsync(ct);

        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .ToListAsync(ct);

        var items = orders.Select(o => new ListOrderItemData
        {
            Id = o.Id,
            OrderNumber = o.OrderNumber ?? string.Empty,
            Status = o.Status,
            FulfillmentStatus = o.FulfillmentStatus,
            TotalAmount = o.TotalAmount,
            Environment = o.Environment,
            CreatedAt = o.CreatedAt,
            PaymentStatus = o.Payment?.Status,
            ItemCount = o.Items.Count,
            Customer = o.Customer != null ? new ListOrderCustomerData
            {
                Id = o.Customer.Id,
                Name = o.Customer.Name,
                Email = o.Customer.Email
            } : null
        }).ToList();

        await Send.OkAsync(new ListOrdersResponse
        {
            Data = new PaginatedResponse<ListOrderItemData>
            {
                Items = items,
                TotalItems = totalItems,
                Page = req.Page,
                PageSize = req.PageSize
            }
        }, ct);
    }
}
