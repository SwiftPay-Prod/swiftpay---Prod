using safefy_api_core.Models.Calculation;
using safefy_api_core.Models.Database;

namespace safefy_api_core.Interfaces;

public interface IMerchantCalculationService
{
    Task<MerchantWithdrawalFeeSettings> GetWithdrawalFeeSettingsAsync(
        Guid merchantId,
        CancellationToken ct = default);

    Task<MerchantPaymentFeeSettings> GetPaymentFeeSettingsAsync(
        Guid merchantId,
        PaymentMethod method,
        PaymentFeeContext feeContext = PaymentFeeContext.Api,
        CancellationToken ct = default,
        int installments = 1);

    long CalculateMerchantSettlementAmount(long netAmount, MerchantPaymentFeeSettings settings);

    long CalculateMerchantReserveAmount(long netAmount, MerchantPaymentFeeSettings settings);

    Task<MerchantCashoutPreview> PreviewCashoutAsync(
        Guid merchantId,
        long amount,
        Guid? merchantAcquirerId,
        bool consolidateAllAcquirers,
        CancellationToken ct = default);
}
