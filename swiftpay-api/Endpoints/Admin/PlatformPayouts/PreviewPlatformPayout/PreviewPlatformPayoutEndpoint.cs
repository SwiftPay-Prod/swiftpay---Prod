using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.EndpointsGroups;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Calculation;
using safefy_api_core.Models.Database;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Admin.PlatformPayouts.PreviewPlatformPayout;

public sealed class PreviewPlatformPayoutEndpoint(
    PrimaryDbContext dbContext,
    IEnvironmentProvider environmentProvider,
    ICalculationService calculationService
) : Endpoint<PreviewPlatformPayoutRequest, PreviewPlatformPayoutResponse>
{
    public override void Configure()
    {
        Post("platform-payouts/preview");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(PreviewPlatformPayoutRequest req, CancellationToken ct)
    {
        var environment = environmentProvider.CurrentEnvironment;

        var acquirers = await dbContext.Acquirers
            .AsNoTracking()
            .Where(a => a.IsActive && a.SupportsWithdrawal)
            .ToListAsync(ct);

        if (acquirers.Count == 0)
        {
            await Send.ResponseAsync(new PreviewPlatformPayoutResponse
            {
                Error = new("Nenhuma adquirente ativa encontrada.")
            }, 400, ct);
            return;
        }

        var availableByAcquirer = await calculationService.GetTotalAvailableForWithdrawalByAcquirerAsync(acquirers, environment, ct);

        List<AdminPreviewPlatformPayoutItemData> items;
        List<PlatformPayoutDistributionItem>? distribution = null;
        var isManualDistribution = req.AcquirerItems is { Count: > 0 };

        if (isManualDistribution)
        {
            var requestItems = req.AcquirerItems!
                .Select(i => new PayoutDistributionRequest(i.AcquirerId, i.Amount))
                .ToList();
            distribution = calculationService.BuildManualPayoutDistribution(requestItems, acquirers, availableByAcquirer);
            items = distribution
                .Select(d => BuildItemData(d.Acquirer, availableByAcquirer.GetValueOrDefault(d.Acquirer.Id, 0), d.Amount, d.Fee, d.Net))
                .ToList();
        }
        else if (req.IncludeAllAcquirers && !req.TotalAmount.HasValue)
        {
            items = BuildAvailabilityItems(acquirers, availableByAcquirer);
        }
        else
        {
            distribution = calculationService.BuildSmartPayoutDistribution(req.TotalAmount!.Value, acquirers, availableByAcquirer);
            items = distribution
                .Select(d => BuildItemData(d.Acquirer, availableByAcquirer.GetValueOrDefault(d.Acquirer.Id, 0), d.Amount, d.Fee, d.Net))
                .ToList();
        }

        if (items.Count == 0)
        {
            await Send.ResponseAsync(new PreviewPlatformPayoutResponse
            {
                Error = new("Saldo insuficiente nas adquirentes para realizar o saque.")
            }, 400, ct);
            return;
        }

        var totalDistributableAmount = availableByAcquirer.Values.Sum();
        var totalAmount = items.Sum(i => i.Amount);
        var totalFee = items.Sum(i => i.AcquirerFee);
        var totalNetAmount = items.Sum(i => i.NetAmount);
        var hasRequestedTotalAmount = !isManualDistribution && req.TotalAmount.HasValue;
        var requestedTotalAmount = hasRequestedTotalAmount ? req.TotalAmount!.Value : 0;
        var undistributedAmount = hasRequestedTotalAmount
            ? Math.Max(0, requestedTotalAmount - totalAmount)
            : 0;
        var distributionReason = undistributedAmount > 0
            ? "Parte do valor solicitado não pôde ser alocada porque algumas adquirentes não se enquadraram nas regras de saque (saldo disponível, taxa e limites mínimo/máximo)."
            : null;
        var responseMessage = undistributedAmount > 0
            ? $"Preview parcial aplicado. Solicitado: {requestedTotalAmount}, Distribuído: {totalAmount}, Não distribuído: {undistributedAmount}."
            : null;

        await Send.OkAsync(new PreviewPlatformPayoutResponse
        {
            Message = responseMessage,
            Data = new AdminPreviewPlatformPayoutData
            {
                TotalAvailableAmount = totalDistributableAmount,
                RequestedTotalAmount = hasRequestedTotalAmount ? (long?)requestedTotalAmount : null,
                TotalAmount = totalAmount,
                TotalFee = totalFee,
                TotalNetAmount = totalNetAmount,
                UndistributedAmount = undistributedAmount,
                DistributionReason = distributionReason,
                Items = items
            }
        }, ct);
    }

    private static AdminPreviewPlatformPayoutItemData BuildItemData(
        Acquirer acq, long available, long amount, long fee, long net)
    {
        return new AdminPreviewPlatformPayoutItemData
        {
            AcquirerId = acq.Id,
            AcquirerName = acq.DisplayName ?? acq.Name,
            AcquirerCode = acq.Code,
            AcquirerLogoUrl = acq.LogoUrl,
            AvailableBalance = available,
            Amount = amount,
            AcquirerFee = fee,
            NetAmount = net,
            PayoutFeeMode = acq.PayoutFeeMode.ToString(),
            PayoutFeeFixed = acq.PayoutFeeFixed,
            PayoutFeePercentage = acq.PayoutFeePercentage
        };
    }

    private static List<AdminPreviewPlatformPayoutItemData> BuildAvailabilityItems(
        List<Acquirer> acquirers,
        Dictionary<Guid, long> balances)
    {
        var items = new List<AdminPreviewPlatformPayoutItemData>();

        foreach (var acq in acquirers)
        {
            var available = balances.GetValueOrDefault(acq.Id, 0);
            items.Add(BuildItemData(acq, available, 0, 0, 0));
        }

        return items;
    }
}
