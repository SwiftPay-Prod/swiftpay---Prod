namespace swiftpay_api.Interfaces;

public interface IAutomaticCashoutService
{
    Task ProcessMerchantCashoutsAsync(CancellationToken ct = default);
    Task ProcessPlatformCashoutAsync(CancellationToken ct = default);
}
