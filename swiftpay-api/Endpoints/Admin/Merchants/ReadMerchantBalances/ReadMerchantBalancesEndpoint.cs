using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Utils;
using swiftpay_api.EndpointsGroups;

namespace swiftpay_api.Endpoints.Admin.Merchants.ReadMerchantBalances;

public sealed class ReadMerchantBalancesEndpoint(
    PrimaryDbContext dbContext,
    ILedgerService ledgerService
) : Endpoint<ReadMerchantBalancesRequest, ReadMerchantBalancesResponse>
{
    public override void Configure()
    {
        Get("merchants/{id:guid}/balances");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ReadMerchantBalancesRequest req, CancellationToken ct)
    {
        var adminId = EndpointUtils.GetUserId(User);
        if (adminId == null)
        {
            await Send.ResponseAsync(new ReadMerchantBalancesResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchantAccountTypes = new[]
        {
            AccountType.MerchantAvailable,
            AccountType.MerchantPending,
            AccountType.MerchantBlocked,
            AccountType.MerchantReserved,
            AccountType.MerchantPayoutsOut
        };

        var accountBalances = await dbContext.Accounts
            .AsNoTracking()
            .Where(a => a.MerchantId == req.Id && merchantAccountTypes.Contains(a.Type))
            .GroupBy(a => new { a.MerchantAcquirerId, a.Type })
            .Select(g => new
            {
                g.Key.MerchantAcquirerId,
                g.Key.Type,
                Balance = g.Sum(x => x.Balance)
            })
            .ToListAsync(ct);

        var acquirerIds = accountBalances
            .Where(x => x.MerchantAcquirerId.HasValue)
            .Select(x => x.MerchantAcquirerId!.Value)
            .Distinct()
            .ToList();

        var merchantAcquirers = await dbContext.MerchantAcquirers
            .AsNoTracking()
            .Include(ma => ma.Acquirer)
            .Where(ma => acquirerIds.Contains(ma.Id))
            .ToDictionaryAsync(ma => ma.Id, ct);

        var paymentTotals = await dbContext.Payments
            .AsNoTracking()
            .Where(p => p.MerchantId == req.Id && p.Status == PaymentStatus.Completed)
            .GroupBy(p => p.MerchantAcquirerId)
            .Select(g => new
            {
                AcquirerId = g.Key,
                TotalIn = g.Sum(p => p.Amount)
            })
            .ToListAsync(ct);

        var balanceInfo = await ledgerService.GetMerchantBalanceInfoAsync(req.Id);

        var allAcquirerGroups = accountBalances
            .Select(x => x.MerchantAcquirerId)
            .Distinct()
            .OrderBy(id => id.HasValue ? 1 : 0)
            .ThenBy(id => id.HasValue
                ? (merchantAcquirers.TryGetValue(id.Value, out var ma) ? (ma.ActivatedAt ?? ma.CreatedAt) : DateTime.MinValue)
                : DateTime.MinValue)
            .Select(acquirerId =>
            {
                var typeMap = accountBalances
                    .Where(x => x.MerchantAcquirerId == acquirerId)
                    .ToDictionary(x => x.Type, x => x.Balance);

                string acquirerName;
                string? acquirerDisplayName;
                string? acquirerCode;
                string? acquirerLogoUrl;
                bool isActive;
                if (acquirerId.HasValue && merchantAcquirers.TryGetValue(acquirerId.Value, out var ma))
                {
                    acquirerName = ma.Acquirer.Name;
                    acquirerDisplayName = ma.Acquirer.DisplayName;
                    acquirerCode = ma.Acquirer.Code;
                    acquirerLogoUrl = ma.Acquirer.LogoUrl;
                    isActive = ma.IsActive;
                }
                else
                {
                    acquirerName = "Legado";
                    acquirerDisplayName = null;
                    acquirerCode = null;
                    acquirerLogoUrl = null;
                    isActive = false;
                }

                var pt = acquirerId.HasValue
                    ? paymentTotals.FirstOrDefault(x => x.AcquirerId == acquirerId.Value)
                    : null;

                return new AdminMerchantAcquirerBucket
                {
                    MerchantAcquirerId = acquirerId,
                    AcquirerName = acquirerName,
                    AcquirerDisplayName = acquirerDisplayName,
                    AcquirerCode = acquirerCode,
                    AcquirerLogoUrl = acquirerLogoUrl,
                    IsActive = isActive,
                    Available = typeMap.GetValueOrDefault(AccountType.MerchantAvailable),
                    Pending = typeMap.GetValueOrDefault(AccountType.MerchantPending),
                    Blocked = typeMap.GetValueOrDefault(AccountType.MerchantBlocked),
                    Reserved = typeMap.GetValueOrDefault(AccountType.MerchantReserved),
                    PayoutsOut = typeMap.GetValueOrDefault(AccountType.MerchantPayoutsOut),
                    TotalIn = pt?.TotalIn ?? 0
                };
            })
            .ToList();

        await Send.OkAsync(new ReadMerchantBalancesResponse
        {
            Data = new AdminMerchantBalancesData
            {
                Acquirers = allAcquirerGroups,
                Totals = new AdminMerchantBalanceTotals
                {
                    LifetimeVolume = balanceInfo.LifetimeVolume,
                    LifetimePayouts = balanceInfo.LifetimePayouts,
                    LifetimeRefunds = balanceInfo.LifetimeRefunds,
                    LifetimeFeesPaid = balanceInfo.LifetimeFeesPaid
                }
            }
        }, ct);
    }
}
