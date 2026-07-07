using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Utils;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api.Mappers;

namespace swiftpay_api.Endpoints.Merchants.Payments.ReadListPayments;

public sealed class ReadListPaymentsEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadListPaymentsRequest, ReadListPaymentsResponse>
{
    public override void Configure()
    {
        Get("{merchantId:guid}/payments");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadListPaymentsRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadListPaymentsResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var isAdmin = EndpointUtils.IsAdmin(User);
        var merchantQuery = dbContext.Merchants.AsNoTracking();
        var merchant = isAdmin
            ? await merchantQuery.OrderBy(m => m.Id).FirstOrDefaultAsync(m => m.Id == req.MerchantId, ct)
            : await merchantQuery.OrderBy(m => m.Id).FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new ReadListPaymentsResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        if (!isAdmin && merchant.Status != MerchantStatus.Active)
        {
            await Send.ResponseAsync(new ReadListPaymentsResponse
            {
                Error = new("Organização não está ativa.")
            }, 403, ct);
            return;
        }

        var merchantSettings = await dbContext.MerchantSettings
            .AsNoTracking()
            .Where(ms => ms.MerchantId == req.MerchantId)
            .OrderBy(ms => ms.Id)
            .FirstOrDefaultAsync(ct);

        var query = dbContext.Payments
            .AsNoTracking()
            .Include(p => p.PaymentPix)
            .Include(p => p.Customer)
            .Include(p => p.Order)
                .ThenInclude(o => o!.Checkout)
            .Where(p => p.MerchantId == req.MerchantId && !p.SuppressMerchantVisibility);

        if (req.Status.HasValue)
            query = query.Where(p => p.Status == req.Status.Value);

        if (req.Method.HasValue)
            query = query.Where(p => p.Method == req.Method.Value);

        if (req.CustomerId.HasValue)
            query = query.Where(p => p.CustomerId == req.CustomerId.Value);

        if (req.StartDate.HasValue)
            query = query.Where(p => p.CreatedAt >= req.StartDate.Value);

        if (req.EndDate.HasValue)
            query = query.Where(p => p.CreatedAt <= req.EndDate.Value.AddDays(1).AddTicks(-1));

        if (!string.IsNullOrWhiteSpace(req.Search))
        {
            var searchValue = req.Search.Trim();
            var searchLower = searchValue.ToLower();
            var searchSanitized = SanitizeUtils.SanitizeNumeric(searchValue) ?? "";
            var hasGuid = Guid.TryParse(searchValue, out var searchGuid);
            var hasNumeric = !string.IsNullOrEmpty(searchSanitized);

            query = query.Where(p =>
                (hasGuid && p.Id == searchGuid) ||
                (p.PaymentPix != null && p.PaymentPix.TxId != null && p.PaymentPix.TxId.ToLower().Contains(searchLower)) ||
                (p.PaymentPix != null && p.PaymentPix.EndToEndId != null && p.PaymentPix.EndToEndId.ToLower().Contains(searchLower)) ||
                (p.PaymentPix != null && p.PaymentPix.PayerName != null && p.PaymentPix.PayerName.ToLower().Contains(searchLower)) ||
                (hasNumeric && p.PaymentPix != null && p.PaymentPix.PayerDocument != null && p.PaymentPix.PayerDocument.Contains(searchSanitized)) ||
                (p.ExternalId != null && p.ExternalId.ToLower().Contains(searchLower)) ||
                (p.Description != null && p.Description.ToLower().Contains(searchLower)) ||
                (p.Customer != null && p.Customer.Name.ToLower().Contains(searchLower)) ||
                (p.Customer != null && p.Customer.Email != null && p.Customer.Email.ToLower().Contains(searchLower)) ||
                (hasNumeric && p.Customer != null && p.Customer.Document != null && p.Customer.Document.Contains(searchSanitized))
            );
        }

        var totalItems = await query.CountAsync(ct);

        var payments = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .ToListAsync(ct);

        var platformDbSettings = await dbContext.PlatformSettings
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(ct) ?? new PlatformSettings();

        var items = payments
            .Select(payment => PaymentMapper.ToMinimalData(payment, platformDbSettings, merchantSettings))
            .ToList();

        await Send.ResponseAsync(new ReadListPaymentsResponse
        {
            Data = new Paginated<MinimalPayment>
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
