using safefy_api_core.Models.Calculation;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api_core.Interfaces;

public interface ICalculationService
{
    // ==== Primitivos: lucro por adquirente ====

    Task<Dictionary<Guid, long>> GetPaymentProfitByAcquirerAsync(ApiEnvironment environment, CancellationToken ct = default);

    Task<Dictionary<Guid, long>> GetPayoutProfitByAcquirerAsync(ApiEnvironment environment, CancellationToken ct = default);

    Task<Dictionary<Guid, long>> GetAcquirerFeesFromPaymentsByAcquirerAsync(ApiEnvironment environment, CancellationToken ct = default);

    Task<Dictionary<Guid, long>> GetCompletedPlatformPayoutsByAcquirerAsync(
        ApiEnvironment environment,
        IReadOnlyList<Guid>? acquirerIds = null,
        CancellationToken ct = default);

    Task<Dictionary<Guid, long>> GetProcessingPlatformPayoutsByAcquirerAsync(
        ApiEnvironment environment,
        IReadOnlyList<Guid>? acquirerIds = null,
        CancellationToken ct = default);

    // ==== Compostos: saldo calculado ====

    Task<Dictionary<Guid, long>> GetPlatformProfitByAcquirerAsync(
        ApiEnvironment environment,
        CancellationToken ct = default);

    Task<Dictionary<Guid, AcquirerBalanceSnapshot>> GetCurrentAcquirerBalanceSnapshotsAsync(
        IReadOnlyList<Guid>? acquirerIds,
        ApiEnvironment environment,
        CancellationToken ct = default);

    Task<Dictionary<Guid, long>> GetTotalAvailableForWithdrawalByAcquirerAsync(
        IReadOnlyList<Acquirer> acquirers,
        ApiEnvironment environment,
        CancellationToken ct = default);

    long CalculateGrossBalance(long settlementBalance, long payoutsOutBalance);

    long CalculatePlatformProfit(long grossBalance, long merchantBalance);

    long CalculateSafefyProfit(long safefyProfitBase, long completedPlatformPayouts);

    long CalculateMerchantBalance(long grossBalance, long safefyProfit);

    long CalculateAvailableForWithdrawal(long grossBalance, long merchantAvailableBalance);

    long CalculateMerchantReserveAmount(long netAmount, int reservePercentageBasisPoints);

    long CalculateMerchantSettlementAmount(long netAmount, int reservePercentageBasisPoints);

    long CalculateRefundedMerchantSettlementAmount(long merchantSettlementAmount, long originalAmount, long refundedAmount);

    // ==== Reconciliação de saldo da plataforma ====

    Task<Dictionary<Guid, long>> GetAutoSplitProfitByAcquirerAsync(ApiEnvironment environment, CancellationToken ct = default);

    Task<Dictionary<Guid, long>> GetPartiallyRefundedRemainingProfitByAcquirerAsync(ApiEnvironment environment, CancellationToken ct = default);

    Task<PlatformExpectedBalances> GetPlatformExpectedBalancesAsync(
        ApiEnvironment environment,
        CancellationToken ct = default);

    // ==== Distribuição de saque ====

    List<PlatformPayoutDistributionItem> BuildSmartPayoutDistribution(
        long totalAmount,
        IReadOnlyList<Acquirer> acquirers,
        IReadOnlyDictionary<Guid, long> availableByAcquirer);

    List<PlatformPayoutDistributionItem> BuildManualPayoutDistribution(
        IReadOnlyList<PayoutDistributionRequest> requestItems,
        IReadOnlyList<Acquirer> acquirers,
        IReadOnlyDictionary<Guid, long> availableByAcquirer);

    // ==== Comissão de indicação (cálculo puro) ====

    long CalculateEstimatedReferralCommission(long eligibleProfit, int referralCommissionBasisPoints);

    (long FromPayments, long FromPayouts, long Total) CalculateEstimatedReferralCommissionTotal(
        long eligibleProfitFromPayments,
        long eligibleProfitFromPayouts,
        int referralCommissionBasisPoints);

    (long FromPayments, long FromPayouts, long Total) CalculateEstimatedReferralCommissionTotalFromMovements(
        IReadOnlyCollection<long> paymentProfits,
        IReadOnlyCollection<long> payoutProfits,
        int referralCommissionBasisPoints);
}
