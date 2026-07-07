using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.Endpoints.Models;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Utils;
using swiftpay_api.Mappers;

namespace swiftpay_api.Endpoints.Admin.Transactions.ReadListTransactions;

public sealed class AdminReadListTransactionsEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<AdminReadListTransactionsRequest, AdminReadListTransactionsResponse>
{
    public override void Configure()
    {
        Get("/transactions");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(AdminReadListTransactionsRequest req, CancellationToken ct)
    {
        var query = dbContext.Payments
            .AsNoTracking()
            .Include(p => p.PaymentPix)
            .Include(p => p.Merchant)
                .ThenInclude(m => m.MerchantKyc)
            .Include(p => p.Merchant)
                .ThenInclude(m => m.MerchantSettings)
            .Include(p => p.MerchantAcquirer)
                .ThenInclude(ma => ma.Acquirer)
            .AsQueryable();

        if (req.MerchantId.HasValue)
            query = query.Where(p => p.MerchantId == req.MerchantId.Value);

        if (req.AcquirerId.HasValue)
            query = query.Where(p => p.MerchantAcquirer != null && p.MerchantAcquirer.AcquirerId == req.AcquirerId.Value);

        if (req.Status.HasValue)
            query = query.Where(p => p.Status == req.Status.Value);

        if (req.Method.HasValue)
            query = query.Where(p => p.Method == req.Method.Value);

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
                (p.AcquirerDisplayName != null && p.AcquirerDisplayName.ToLower().Contains(searchLower)) ||
                (p.MerchantAcquirer != null && p.MerchantAcquirer.Acquirer != null && p.MerchantAcquirer.Acquirer.DisplayName != null && p.MerchantAcquirer.Acquirer.DisplayName.ToLower().Contains(searchLower)) ||
                (p.MerchantAcquirer != null && p.MerchantAcquirer.Acquirer != null && p.MerchantAcquirer.Acquirer.Name.ToLower().Contains(searchLower)) ||
                (p.Merchant.Name != null && p.Merchant.Name.ToLower().Contains(searchLower)) ||
                (hasNumeric && p.Merchant.MerchantKyc != null && p.Merchant.MerchantKyc.DocumentNumber != null && p.Merchant.MerchantKyc.DocumentNumber.Contains(searchSanitized))
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
            .Select(payment => AdminTransactionMapper.ToMinimalData(
                payment,
                platformDbSettings,
                payment.Merchant?.MerchantSettings))
            .ToList();

        await Send.ResponseAsync(new AdminReadListTransactionsResponse
        {
            Data = new Paginated<AdminMinimalTransaction>
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
