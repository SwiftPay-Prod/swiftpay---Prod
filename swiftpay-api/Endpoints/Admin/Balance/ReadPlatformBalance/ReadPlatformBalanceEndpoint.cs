using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Utils;
using swiftpay_api.EndpointsGroups;

namespace swiftpay_api.Endpoints.Admin.Balance.ReadPlatformBalance;

public sealed class ReadPlatformBalanceEndpoint(
    PrimaryDbContext dbContext,
    ILedgerService ledgerService,
    IEnvironmentProvider environmentProvider,
    ICalculationService calculationService
) : EndpointWithoutRequest<ReadPlatformBalanceResponse>
{
    public override void Configure()
    {
        Get("/balance");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadPlatformBalanceResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var platformBalance = await ledgerService.GetPlatformBalanceInfoAsync();
        var environment = environmentProvider.CurrentEnvironment;

        var acquirerFeesByAcquirer = await calculationService.GetAcquirerFeesFromPaymentsByAcquirerAsync(environment, ct);
        var processingPlatformPayoutsByAcquirer = await calculationService.GetProcessingPlatformPayoutsByAcquirerAsync(environment, null, ct);

        var allAcquirers = await dbContext.Acquirers
            .AsNoTracking()
            .Where(a => a.IsActive && a.SupportsWithdrawal)
            .Select(a => new
            {
                a.Id,
                a.Name,
                a.Code,
                a.DisplayName,
                a.LogoUrl,
                a.PayoutFeeMode,
                a.PayoutFeeFixed,
                a.PayoutFeePercentage
            })
            .ToListAsync(ct);

        var balanceSnapshotsByAcquirer = await calculationService.GetCurrentAcquirerBalanceSnapshotsAsync(
            allAcquirers.Select(a => a.Id).ToList(),
            environment,
            ct);

        var acquirerById = allAcquirers.ToDictionary(a => a.Id, a => a);
        var availableByAcquirer = await calculationService.GetTotalAvailableForWithdrawalByAcquirerAsync(
            allAcquirers
                .Select(a => new Acquirer
                {
                    Id = a.Id,
                    Name = a.Name,
                    DisplayName = a.DisplayName,
                    Code = a.Code,
                    LogoUrl = a.LogoUrl,
                    PayoutFeeMode = a.PayoutFeeMode,
                    PayoutFeeFixed = a.PayoutFeeFixed,
                    PayoutFeePercentage = a.PayoutFeePercentage,
                    IsActive = true,
                    SupportsWithdrawal = true
                })
                .ToList(),
            environment,
            ct);
        var acquirerIds = allAcquirers.Select(a => a.Id).Distinct();

        var acquirerBalances = acquirerIds
            .Select(acquirerId =>
            {
                var hasAcquirer = acquirerById.TryGetValue(acquirerId, out var acquirer);
                var snapshot = balanceSnapshotsByAcquirer.GetValueOrDefault(acquirerId);
                var settlementBalance = snapshot?.SettlementBalance ?? 0;
                var payoutsOutBalance = snapshot?.PayoutsOutBalance ?? 0;
                var grossBalance = calculationService.CalculateGrossBalance(settlementBalance, payoutsOutBalance);

                var merchantBalance = snapshot?.MerchantBalance ?? 0;
                var merchantAvailableBalance = snapshot?.MerchantAvailableBalance ?? 0;
                var swiftpayProfit = calculationService.CalculateAvailableForWithdrawal(grossBalance, merchantAvailableBalance);

                var totalAcquirerFees = acquirerFeesByAcquirer.GetValueOrDefault(acquirerId, 0);

                var payoutFeeMode = hasAcquirer ? acquirer!.PayoutFeeMode : FeeChargeMode.FixedOnly;
                var payoutFeeFixed = hasAcquirer ? acquirer!.PayoutFeeFixed : 0;
                var payoutFeePercentage = hasAcquirer ? acquirer!.PayoutFeePercentage : 0;

                var pendingPlatformPayouts = processingPlatformPayoutsByAcquirer.GetValueOrDefault(acquirerId, 0);
                var availableForWithdrawal = availableByAcquirer.GetValueOrDefault(acquirerId, 0);
                var profitToWithdraw = availableForWithdrawal;

                var withdrawalFee = profitToWithdraw > 0
                    ? FeeCalculator.Calculate(profitToWithdraw, payoutFeeMode, payoutFeeFixed, payoutFeePercentage)
                    : 0;

                return new AdminAcquirerBalanceData
                {
                    AcquirerId = acquirerId,
                    AcquirerName = hasAcquirer ? acquirer!.Name : "Desconhecido",
                    AcquirerDisplayName = hasAcquirer ? acquirer!.DisplayName : null,
                    AcquirerCode = hasAcquirer ? acquirer!.Code : "unknown",
                    AcquirerLogoUrl = hasAcquirer ? acquirer!.LogoUrl : null,
                    TotalIn = settlementBalance,
                    TotalOut = payoutsOutBalance,
                    GrossBalance = grossBalance,
                    MerchantBalance = merchantBalance,
                    MerchantAvailableBalance = merchantAvailableBalance,
                    SwiftPayProfit = swiftpayProfit,
                    TotalAcquirerFees = totalAcquirerFees,
                    PayoutFeeMode = payoutFeeMode,
                    PayoutFeeFixed = payoutFeeFixed,
                    PayoutFeePercentage = payoutFeePercentage,
                    WithdrawalFeeIfWithdrawAll = withdrawalFee,
                    AvailableForWithdrawal = availableForWithdrawal,
                    NetIfWithdrawAll = availableForWithdrawal - withdrawalFee,
                    PlatformPayoutsProcessing = pendingPlatformPayouts
                };
            })
            .OrderBy(a => a.AcquirerDisplayName ?? a.AcquirerName)
            .ToList();

        // Calcular totais de taxas
        var totalWithdrawalFee = acquirerBalances.Sum(a => a.WithdrawalFeeIfWithdrawAll);
        var totalAvailableForWithdrawal = acquirerBalances.Sum(a => a.AvailableForWithdrawal);
        var totalAcquirerGrossBalance = acquirerBalances.Sum(a => a.GrossBalance);
        var totalSwiftPayProfit = acquirerBalances.Sum(a => a.SwiftPayProfit);
        var totalMerchantAvailable = acquirerBalances.Sum(a => a.MerchantAvailableBalance);
        var totalMerchantBalance = acquirerBalances.Sum(a => a.MerchantBalance);
        var totalMerchantBlocked = totalMerchantBalance - totalMerchantAvailable;
        var totalPlatformOperationalBalance = totalAvailableForWithdrawal + platformBalance.Blocked;
        var consistencyDifference = totalAcquirerGrossBalance - (totalPlatformOperationalBalance + totalMerchantBalance);

        // Buscar total de PlatformFee de todos os pagamentos Completed
        var totalPlatformFees = await dbContext.Payments
            .Where(p => p.Status == PaymentStatus.Completed && p.Environment == environment)
            .SumAsync(p => p.PlatformFee + p.CheckoutTemplateFee, ct);

        await Send.OkAsync(new ReadPlatformBalanceResponse
        {
            Data = new AdminPlatformBalanceData
            {
                PlatformBlocked = platformBalance.Blocked,
                PlatformPayoutsOut = platformBalance.LifetimePayoutsOut,
                TotalPlatformOperationalBalance = totalPlatformOperationalBalance,
                TotalMerchantAvailable = totalMerchantAvailable,
                TotalMerchantBlocked = totalMerchantBlocked,
                TotalMerchantBalance = totalMerchantBalance,
                TotalAcquirerGrossBalance = totalAcquirerGrossBalance,
                TotalSwiftPayProfit = totalSwiftPayProfit,
                ConsistencyDifference = consistencyDifference,
                ConsistencyDifferenceAbsolute = Math.Abs(consistencyDifference),
                IsConsistent = consistencyDifference == 0,
                TotalPlatformFees = totalPlatformFees,
                TotalWithdrawalFeeIfWithdrawAll = totalWithdrawalFee,
                TotalAvailableForWithdrawal = totalAvailableForWithdrawal,
                NetIfWithdrawAll = totalAvailableForWithdrawal - totalWithdrawalFee,
                AcquirerBalances = acquirerBalances
            }
        }, ct);
    }
}
