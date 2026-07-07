using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Database;
using swiftpay_api_payment.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api_payment.Endpoints.Utils;
using swiftpay_api_payment.Endpoints.Models;
using swiftpay_api_payment.Documentation;
using swiftpay_api_payment.Mappers;

namespace swiftpay_api_payment.Endpoints.Transactions.List;

public sealed class ListTransactionsEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ListTransactionsRequest, ListTransactionsResponse>
{
    public override void Configure()
    {
        Get("");
        Group<TransactionsGroup>();
        Description(d => d
            .Produces<ListTransactionsResponse>(200, "application/json")
            .Produces<ListTransactionsResponse>(401, "application/json")
            .WithSummary("Listar transações")
            .WithDescription(EndpointDescriptions.ListTransactionsDescription));
    }

    public override async Task HandleAsync(ListTransactionsRequest req, CancellationToken ct)
    {
        var merchantId = PaymentEndpointUtils.GetMerchantId(User);
        var environment = PaymentEndpointUtils.GetEnvironment(User);

        if (merchantId == null || !environment.HasValue)
        {
            await Send.ResponseAsync(new ListTransactionsResponse
            {
                Error = new ApiErrorResponse("Token inválido.", "invalid_token")
            }, 401, ct);
            return;
        }

        var query = dbContext.Payments
            .AsNoTracking()
            .Where(p => p.MerchantId == merchantId && !p.SuppressMerchantVisibility);

        if (req.Method.HasValue)
            query = query.Where(p => p.Method == req.Method.Value);

        if (req.Status.HasValue)
            query = query.Where(p => p.Status == req.Status.Value);

        if (!string.IsNullOrEmpty(req.ExternalId))
            query = query.Where(p => p.ExternalId == req.ExternalId);

        if (req.CustomerId.HasValue)
            query = query.Where(p => p.CustomerId == req.CustomerId);

        if (req.StartDate.HasValue)
        {
            var startDateUtc = req.StartDate.Value.Kind == DateTimeKind.Utc 
                ? req.StartDate.Value 
                : DateTime.SpecifyKind(req.StartDate.Value, DateTimeKind.Utc);
            query = query.Where(p => p.CreatedAt >= startDateUtc);
        }

        if (req.EndDate.HasValue)
        {
            var endDateUtc = req.EndDate.Value.Kind == DateTimeKind.Utc 
                ? req.EndDate.Value 
                : DateTime.SpecifyKind(req.EndDate.Value, DateTimeKind.Utc);
            query = query.Where(p => p.CreatedAt <= endDateUtc);
        }

        // Get total count
        var totalItems = await query.CountAsync(ct);

        // Apply pagination and ordering
        var payments = await query
            .OrderByDescending(p => p.CreatedAt)
            .Include(p => p.Customer)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .ToListAsync(ct);

        var items = payments.Select(TransactionMapper.ToListItemData).ToList();

        await Send.OkAsync(new ListTransactionsResponse
        {
            Data = new PaginatedResponse<TransactionListItemData>
            {
                Items = items,
                Page = req.Page,
                PageSize = req.PageSize,
                TotalItems = totalItems
            }
        }, ct);
    }
}
