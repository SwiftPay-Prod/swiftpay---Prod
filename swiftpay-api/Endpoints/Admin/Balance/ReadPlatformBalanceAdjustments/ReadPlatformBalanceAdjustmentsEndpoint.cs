using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api.Endpoints.Admin.Balance.CreatePlatformBalanceAdjustment;
using swiftpay_api.Endpoints.Models;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Database;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Admin.Balance.ReadPlatformBalanceAdjustments;

public sealed class ReadPlatformBalanceAdjustmentsEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadPlatformBalanceAdjustmentsRequest, ReadPlatformBalanceAdjustmentsResponse>
{
    public override void Configure()
    {
        Get("balance/adjustments");
        Group<AdminGroup>();
        Roles(nameof(UserRole.God), nameof(UserRole.Admin));
    }

    public override async Task HandleAsync(ReadPlatformBalanceAdjustmentsRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadPlatformBalanceAdjustmentsResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        LedgerTransactionOperation[] adjustmentOperations =
        [
            LedgerTransactionOperation.PlatformAdjustment,
            LedgerTransactionOperation.AcquirerAdjustment,
            LedgerTransactionOperation.AcquirerSwiftPayProfitAdjustment,
            LedgerTransactionOperation.MerchantAdjustment
        ];

        var query = dbContext.LedgerTransactions
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(t => adjustmentOperations.Contains(t.Operation));

        if (req.Scope.HasValue)
        {
            var scopeOperation = req.Scope.Value switch
            {
                AdjustmentScope.Platform => LedgerTransactionOperation.PlatformAdjustment,
                AdjustmentScope.Acquirer => LedgerTransactionOperation.AcquirerAdjustment,
                _ => LedgerTransactionOperation.MerchantAdjustment
            };
            query = req.Scope == AdjustmentScope.Acquirer
                ? query.Where(t => t.Operation == LedgerTransactionOperation.AcquirerAdjustment
                                || t.Operation == LedgerTransactionOperation.AcquirerSwiftPayProfitAdjustment)
                : query.Where(t => t.Operation == scopeOperation);
        }

        if (req.ExcludeMerchant)
            query = query.Where(t => t.Operation != LedgerTransactionOperation.MerchantAdjustment);

        if (req.AcquirerId.HasValue)
            query = query.Where(t => t.LedgerEntries.Any(e => e.Account.AcquirerId == req.AcquirerId.Value));

        if (req.MerchantId.HasValue)
            query = query.Where(t => t.LedgerEntries.Any(e => e.Account.MerchantId == req.MerchantId.Value));

        if (req.StartDate.HasValue)
        {
            var startDate = DateTime.SpecifyKind(req.StartDate.Value.Date, DateTimeKind.Utc);
            query = query.Where(t => t.CreatedAt >= startDate);
        }

        if (req.EndDate.HasValue)
        {
            var endDate = DateTime.SpecifyKind(req.EndDate.Value.Date.AddDays(1), DateTimeKind.Utc);
            query = query.Where(t => t.CreatedAt < endDate);
        }

        var totalItems = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .AsSplitQuery()
            .Include(t => t.LedgerEntries)
                .ThenInclude(e => e.Account)
                    .ThenInclude(a => a.Acquirer)
            .Include(t => t.LedgerEntries)
                .ThenInclude(e => e.Account)
                    .ThenInclude(a => a.Merchant)
            .ToListAsync(ct);

        var data = items.Select(t =>
        {
            var scope = t.Operation switch
            {
                LedgerTransactionOperation.AcquirerAdjustment => AdjustmentScope.Acquirer,
                LedgerTransactionOperation.AcquirerSwiftPayProfitAdjustment => AdjustmentScope.Acquirer,
                LedgerTransactionOperation.MerchantAdjustment => AdjustmentScope.Merchant,
                _ => AdjustmentScope.Platform
            };

            var acquirerEntry = t.LedgerEntries.FirstOrDefault(e => e.Account.AcquirerId != null);
            var merchantEntry = t.LedgerEntries.FirstOrDefault(e => e.Account.MerchantId != null);

            var targetEntry = scope switch
            {
                AdjustmentScope.Acquirer => acquirerEntry,
                AdjustmentScope.Merchant => merchantEntry,
                _ => t.LedgerEntries.FirstOrDefault()
            };

            return new AdminPlatformBalanceAdjustmentHistoryData
            {
                TransactionId = t.Id,
                Scope = scope,
                AcquirerId = acquirerEntry?.Account.AcquirerId,
                AcquirerName = acquirerEntry?.Account.Acquirer?.Name,
                AcquirerCode = acquirerEntry?.Account.Acquirer?.Code,
                MerchantId = merchantEntry?.Account.MerchantId,
                MerchantName = merchantEntry?.Account.Merchant?.Name,
                Environment = merchantEntry?.Account.Environment.ToString(),
                Amount = t.Amount,
                IsCredit = targetEntry?.Type == LedgerEntryType.Credit,
                Notes = t.Notes,
                CreatedAt = t.CreatedAt
            };
        }).ToList();

        await Send.ResponseAsync(new ReadPlatformBalanceAdjustmentsResponse
        {
            Data = new Paginated<AdminPlatformBalanceAdjustmentHistoryData>
            {
                Items = data,
                TotalItems = totalItems,
                Page = req.Page,
                PageSize = req.PageSize,
                TotalPages = (int)Math.Ceiling(totalItems / (double)req.PageSize)
            }
        }, 200, ct);
    }
}
