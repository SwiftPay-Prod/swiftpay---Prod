using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Models.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Merchants.Settings.ReadNominals;

public sealed class ReadNominalsEndpoint(
    PrimaryDbContext dbContext,
    ILedgerService ledgerService
) : Endpoint<ReadNominalsRequest, ReadNominalsResponse>
{
    public override void Configure()
    {
        Get("{merchantId:guid}/nominals");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadNominalsRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadNominalsResponse
            {
                Error = new("Token invalido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .AsNoTracking()
            .Include(m => m.MerchantKyc)
            .Include(m => m.MerchantSettings)
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId.Value, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new ReadNominalsResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        if (merchant.Status != MerchantStatus.Active)
        {
            await Send.ResponseAsync(new ReadNominalsResponse
            {
                Error = new("A organização precisa estar ativa para visualizar nominais.")
            }, 400, ct);
            return;
        }

        if (!merchant.MerchantKyc?.OperationType.HasValue ?? true)
        {
            await Send.ResponseAsync(new ReadNominalsResponse
            {
                Error = new("O tipo de operação da organização ainda não foi definido.")
            }, 400, ct);
            return;
        }

        var merchantOperationType = merchant.MerchantKyc!.OperationType!.Value;
        var acquirerOperationType = MapToAcquirerOperationType(merchantOperationType);

        var platformSettings = await dbContext.PlatformSettings
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(ct);

        if (platformSettings == null)
        {
            await Send.ResponseAsync(new ReadNominalsResponse
            {
                Error = new("Configurações da plataforma não encontradas.")
            }, 500, ct);
            return;
        }

        var merchantSettings = merchant.MerchantSettings;

        var merchantAcquirers = await dbContext.MerchantAcquirers
            .AsNoTracking()
            .Include(ma => ma.Acquirer)
            .Where(ma => ma.MerchantId == req.MerchantId)
            .OrderByDescending(ma => ma.IsActive)
            .ThenByDescending(ma => ma.ActivatedAt)
            .ThenByDescending(ma => ma.CreatedAt)
            .ToListAsync(ct);

        var eligibleAcquirersRaw = await dbContext.Acquirers
            .AsNoTracking()
            .Where(a => a.IsActive
                && !a.HideFromMerchantNominalSelection
                && !string.IsNullOrWhiteSpace(a.Nominal))
            .OrderBy(a => a.Nominal)
            .ToListAsync(ct);

        var eligibleAcquirers = eligibleAcquirersRaw
            .Where(a => a.OperationTypes.Contains(acquirerOperationType))
            .ToList();

        var currentMerchantAcquirer = merchantAcquirers.FirstOrDefault(ma => ma.IsActive);

        if (currentMerchantAcquirer == null)
        {
            await Send.ResponseAsync(new ReadNominalsResponse
            {
                Error = new("Nenhuma nominal ativa foi encontrada para esta organizacao.")
            }, 404, ct);
            return;
        }

        var merchantAcquirerByAcquirerId = merchantAcquirers
            .GroupBy(ma => ma.AcquirerId)
            .ToDictionary(
                g => g.Key,
                g => g
                    .OrderByDescending(ma => ma.IsActive)
                    .ThenByDescending(ma => ma.ActivatedAt)
                    .ThenByDescending(ma => ma.CreatedAt)
                    .First());

        eligibleAcquirers = eligibleAcquirers
            .Where(acquirer => acquirer.Id == currentMerchantAcquirer.AcquirerId
                || NominalFeeCompatibilityUtils.IsAcquirerFeeCompatible(
                acquirer,
                merchantAcquirerByAcquirerId.TryGetValue(acquirer.Id, out var linked) ? linked : null,
                merchantSettings,
                platformSettings))
            .ToList();

        var acquirerIds = eligibleAcquirers
            .Select(a => a.Id)
            .Distinct()
            .ToList();

        var yesterdayStats = await GetYesterdayConversionByAcquirerAsync(acquirerIds, ct);
        var last7DaysStats = await GetLast7DaysConversionByAcquirerAsync(acquirerIds, ct);
        var merchantYesterdayStats = await GetYesterdayConversionByAcquirerAsync(acquirerIds, ct, req.MerchantId);
        var merchantLast7DaysStats = await GetLast7DaysConversionByAcquirerAsync(acquirerIds, ct, req.MerchantId);
        var totalTransactionsByAcquirer = await GetTotalTransactionsByAcquirerAsync(acquirerIds, req.MerchantId, ct);

        var balanceInfo = await ledgerService.GetMerchantBalanceInfoAsync(req.MerchantId);
        var hasLegacyBalanceWarning = balanceInfo.AcquirerBucketBalances.Count > 1
            || balanceInfo.AcquirerBucketBalances.Any(b => b.MerchantAcquirerId == null);

        var activeAbTest = await dbContext.MerchantNominalAbTests
            .AsNoTracking()
            .OrderByDescending(t => t.StartedAt)
            .FirstOrDefaultAsync(t => t.MerchantId == req.MerchantId && t.IsActive, ct);

        var options = eligibleAcquirers
            .OrderByDescending(a => a.Id == currentMerchantAcquirer.AcquirerId)
            .ThenBy(a => a.Nominal)
            .Select(acquirer => new MerchantNominalOption
            {
                MerchantAcquirerId = merchantAcquirerByAcquirerId.TryGetValue(acquirer.Id, out var linked) ? linked.Id : null,
                AcquirerId = acquirer.Id,
                Nominal = acquirer.Nominal ?? string.Empty,
                AcquirerCreatedAt = acquirer.CreatedAt,
                ConversionYesterday = yesterdayStats.TryGetValue(acquirer.Id, out var conversion) ? conversion : null,
                MerchantConversionYesterday = merchantYesterdayStats.TryGetValue(acquirer.Id, out var merchantConversion) ? merchantConversion : null,
                TotalTransactions = totalTransactionsByAcquirer.TryGetValue(acquirer.Id, out var totalTransactions) ? totalTransactions : 0,
                IsCurrent = acquirer.Id == currentMerchantAcquirer.AcquirerId,
                IsInAbTest = activeAbTest != null
                    && merchantAcquirerByAcquirerId.TryGetValue(acquirer.Id, out var activeLinked)
                    && (activeLinked.Id == activeAbTest.VariantAMerchantAcquirerId
                        || activeLinked.Id == activeAbTest.VariantBMerchantAcquirerId),
                SupportsPix = acquirer.SupportsPix && acquirer.PixEnabled,
                ConversionLast7Days = last7DaysStats.TryGetValue(acquirer.Id, out var conversion7Days) ? conversion7Days : null,
                MerchantConversionLast7Days = merchantLast7DaysStats.TryGetValue(acquirer.Id, out var merchantConversion7Days) ? merchantConversion7Days : null,
                SupportsBoleto = acquirer.SupportsBoleto && acquirer.BoletoEnabled,
                SupportsCreditCard = acquirer.SupportsCreditCard && acquirer.CreditCardEnabled
            })
            .ToList();

        await Send.OkAsync(new ReadNominalsResponse
        {
            Data = new ReadNominalsData
            {
                CurrentMerchantAcquirerId = currentMerchantAcquirer.Id,
                CurrentNominal = currentMerchantAcquirer.Acquirer.Nominal ?? string.Empty,
                MerchantOperationType = merchantOperationType,
                HasLegacyBalanceWarning = hasLegacyBalanceWarning,
                LegacyBalanceWarningMessage = "Ao trocar de nominal, parte do saldo pode permanecer em ciclos anteriores. Para sacar 100% do valor, pode ser necessário realizar mais de um saque.",
                AbTest = activeAbTest == null
                    ? null
                    : new MerchantNominalAbTestInfo
                    {
                        IsActive = activeAbTest.IsActive,
                        VariantAMerchantAcquirerId = activeAbTest.VariantAMerchantAcquirerId,
                        VariantBMerchantAcquirerId = activeAbTest.VariantBMerchantAcquirerId,
                        VariantAWeightPercent = activeAbTest.VariantAWeightPercent,
                        VariantBWeightPercent = decimal.Round(100.00m - activeAbTest.VariantAWeightPercent, 2),
                        StartedAt = activeAbTest.StartedAt,
                        LimitType = activeAbTest.LimitType,
                        MaxDurationDays = activeAbTest.MaxDurationDays,
                        MaxTransactions = activeAbTest.MaxTransactions,
                        WinnerMerchantAcquirerId = activeAbTest.WinnerMerchantAcquirerId,
                        IsAutoFinished = activeAbTest.IsAutoFinished
                    },
                Nominals = options
            }
        }, ct);
    }

    private async Task<Dictionary<Guid, decimal?>> GetYesterdayConversionByAcquirerAsync(
        List<Guid> acquirerIds,
        CancellationToken ct,
        Guid? merchantId = null)
    {
        if (acquirerIds.Count == 0)
        {
            return [];
        }

        var brasiliaToday = DateTimeUtils.GetBrasiliaTodayDateTime();
        var yesterdayStartBrasilia = brasiliaToday.AddDays(-1);
        var yesterdayEndBrasilia = brasiliaToday.AddTicks(-1);

        var yesterdayStartUtc = TimeZoneInfo.ConvertTimeToUtc(yesterdayStartBrasilia, DateTimeUtils.BrasiliaTimeZone);
        var yesterdayEndUtc = TimeZoneInfo.ConvertTimeToUtc(yesterdayEndBrasilia, DateTimeUtils.BrasiliaTimeZone);

        var paymentsQuery = dbContext.Payments
            .AsNoTracking()
            .Where(p => p.AcquirerId.HasValue
                && acquirerIds.Contains(p.AcquirerId.Value)
                && p.CreatedAt >= yesterdayStartUtc
                && p.CreatedAt <= yesterdayEndUtc);

        if (merchantId.HasValue)
        {
            paymentsQuery = paymentsQuery.Where(p => p.MerchantId == merchantId.Value);
        }

        var grouped = await paymentsQuery
            .GroupBy(p => p.AcquirerId!.Value)
            .Select(g => new
            {
                AcquirerId = g.Key,
                Total = g.Count(),
                Completed = g.Count(x => x.Status == PaymentStatus.Completed)
            })
            .ToListAsync(ct);

        var result = new Dictionary<Guid, decimal?>();
        foreach (var item in grouped)
        {
            result[item.AcquirerId] = item.Total == 0
                ? null
                : Math.Round((decimal)item.Completed / item.Total * 100, 1);
        }

        return result;
    }

    private async Task<Dictionary<Guid, long>> GetTotalTransactionsByAcquirerAsync(
        List<Guid> acquirerIds,
        Guid merchantId,
        CancellationToken ct)
    {
        if (acquirerIds.Count == 0)
        {
            return [];
        }

        var grouped = await dbContext.Payments
            .AsNoTracking()
            .Where(p => p.MerchantId == merchantId
                && p.AcquirerId.HasValue
                && acquirerIds.Contains(p.AcquirerId.Value))
            .GroupBy(p => p.AcquirerId!.Value)
            .Select(g => new
            {
                AcquirerId = g.Key,
                Total = g.LongCount()
            })
            .ToListAsync(ct);

        return grouped.ToDictionary(x => x.AcquirerId, x => x.Total);
    }

    private async Task<Dictionary<Guid, decimal?>> GetLast7DaysConversionByAcquirerAsync(
        List<Guid> acquirerIds,
        CancellationToken ct,
        Guid? merchantId = null)
    {
        if (acquirerIds.Count == 0)
        {
            return new Dictionary<Guid, decimal?>();
        }

        var brasiliaToday = DateTimeUtils.GetBrasiliaTodayDateTime();
        var periodStartBrasilia = brasiliaToday.AddDays(-7);
        var periodEndBrasilia = brasiliaToday.AddTicks(-1);

        var periodStartUtc = TimeZoneInfo.ConvertTimeToUtc(periodStartBrasilia, DateTimeUtils.BrasiliaTimeZone);
        var periodEndUtc = TimeZoneInfo.ConvertTimeToUtc(periodEndBrasilia, DateTimeUtils.BrasiliaTimeZone);

        var paymentsQuery = dbContext.Payments
            .AsNoTracking()
            .Where(p => p.AcquirerId.HasValue
                && acquirerIds.Contains(p.AcquirerId.Value)
                && p.CreatedAt >= periodStartUtc
                && p.CreatedAt <= periodEndUtc);

        if (merchantId.HasValue)
        {
            paymentsQuery = paymentsQuery.Where(p => p.MerchantId == merchantId.Value);
        }

        var grouped = await paymentsQuery
            .GroupBy(p => p.AcquirerId!.Value)
            .Select(g => new
            {
                AcquirerId = g.Key,
                Total = g.Count(),
                Completed = g.Count(x => x.Status == PaymentStatus.Completed)
            })
            .ToListAsync(ct);

        var result = new Dictionary<Guid, decimal?>();
        foreach (var item in grouped)
        {
            result[item.AcquirerId] = item.Total == 0
                ? null
                : Math.Round((decimal)item.Completed / item.Total * 100, 1);
        }

        return result;
    }

    private static AcquirerOperationType MapToAcquirerOperationType(MerchantKycOperationType operationType)
    {
        return operationType == MerchantKycOperationType.Black
            ? AcquirerOperationType.Black
            : AcquirerOperationType.White;
    }
}
