using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.EndpointsGroups;
using safefy_api_core.Database;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Merchants.Settings.ReadNominalsHistory;

public sealed class ReadNominalsHistoryEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadNominalsHistoryRequest, ReadNominalsHistoryResponse>
{
    public override void Configure()
    {
        Get("{merchantId:guid}/nominals/history");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadNominalsHistoryRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadNominalsHistoryResponse
            {
                Error = new("Token invalido.")
            }, 401, ct);
            return;
        }

        var merchantExists = await dbContext.Merchants
            .AsNoTracking()
            .Where(m => m.Id == req.MerchantId && m.UserId == userId.Value)
            .Select(m => m.Id)
            .FirstOrDefaultAsync(ct);

        if (merchantExists == Guid.Empty)
        {
            await Send.ResponseAsync(new ReadNominalsHistoryResponse
            {
                Error = new("Organizacao nao encontrada.")
            }, 404, ct);
            return;
        }

        var currentAcquirerId = await dbContext.MerchantAcquirers
            .AsNoTracking()
            .Where(ma => ma.MerchantId == req.MerchantId && ma.IsActive)
            .Select(ma => ma.AcquirerId)
            .FirstOrDefaultAsync(ct);

        var transactionStats = await dbContext.Payments
            .AsNoTracking()
            .Where(p => p.MerchantId == req.MerchantId && p.AcquirerId.HasValue)
            .GroupBy(p => p.AcquirerId!.Value)
            .Select(g => new
            {
                AcquirerId = g.Key,
                TotalTransactions = g.LongCount(),
                FirstTransactionAt = g.Min(x => x.CreatedAt),
                LastTransactionAt = g.Max(x => x.CreatedAt),
                NominalSnapshot = g.Where(x => x.AcquirerNominal != null)
                    .OrderByDescending(x => x.CreatedAt)
                    .Select(x => x.AcquirerNominal)
                    .FirstOrDefault()
            })
            .ToListAsync(ct);

        var selectionStats = await dbContext.MerchantAcquirerChangeHistories
            .AsNoTracking()
            .Where(h => h.MerchantId == req.MerchantId && h.NewAcquirerId.HasValue)
            .GroupBy(h => h.NewAcquirerId!.Value)
            .Select(g => new
            {
                AcquirerId = g.Key,
                TimesSelected = g.Count(),
                LastSelectedAt = g.Max(x => x.CreatedAt)
            })
            .ToListAsync(ct);

        var acquirerIds = transactionStats.Select(x => x.AcquirerId)
            .Union(selectionStats.Select(x => x.AcquirerId))
            .Append(currentAcquirerId)
            .Where(id => id != Guid.Empty)
            .Distinct()
            .ToList();

        var acquirerNominals = await dbContext.Acquirers
            .AsNoTracking()
            .Where(a => acquirerIds.Contains(a.Id))
            .Select(a => new
            {
                a.Id,
                a.Nominal
            })
            .ToDictionaryAsync(x => x.Id, x => x.Nominal, ct);

        var transactionMap = transactionStats.ToDictionary(x => x.AcquirerId);
        var selectionMap = selectionStats.ToDictionary(x => x.AcquirerId);

        var items = acquirerIds
            .Select(acquirerId =>
            {
                transactionMap.TryGetValue(acquirerId, out var tx);
                selectionMap.TryGetValue(acquirerId, out var selection);
                acquirerNominals.TryGetValue(acquirerId, out var nominalFromAcquirer);

                var nominal = nominalFromAcquirer ?? tx?.NominalSnapshot ?? string.Empty;

                return new MerchantNominalHistoryItem
                {
                    AcquirerId = acquirerId,
                    DisplayLabel = nominal,
                    Nominal = nominal,
                    TotalTransactions = tx?.TotalTransactions ?? 0,
                    TimesSelected = selection?.TimesSelected ?? 0,
                    FirstTransactionAt = tx?.FirstTransactionAt,
                    LastTransactionAt = tx?.LastTransactionAt,
                    LastSelectedAt = selection?.LastSelectedAt,
                    IsCurrent = acquirerId == currentAcquirerId
                };
            })
            .Where(x => !string.IsNullOrWhiteSpace(x.Nominal))
            .OrderByDescending(x => x.IsCurrent)
            .ThenByDescending(x => x.TotalTransactions)
            .ThenBy(x => x.Nominal)
            .ToList();

        await Send.OkAsync(new ReadNominalsHistoryResponse
        {
            Data = new ReadNominalsHistoryData
            {
                Items = items
            }
        }, ct);
    }

}
