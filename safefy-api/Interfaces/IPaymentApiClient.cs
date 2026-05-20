using safefy_api.Models.PaymentApi;

namespace safefy_api.Interfaces;

public interface IPaymentApiClient
{
    Task<CreateCashoutApiResult> CreateCashoutAsync(CreateCashoutApiInput input, CancellationToken ct = default);
    Task<CancelCashoutApiResult> CancelCashoutAsync(CancelCashoutApiInput input, CancellationToken ct = default);
    Task<EvaluateCashoutApiResult> EvaluateCashoutAsync(EvaluateCashoutApiInput input, CancellationToken ct = default);
    Task<SimulateCashoutApiResult> SimulateCashoutAsync(SimulateCashoutApiInput input, CancellationToken ct = default);
    Task<CreateTransactionApiResult> CreateTransactionAsync(CreateTransactionApiInput input, CancellationToken ct = default);
    Task<CreatePaymentLinkApiResult> CreatePaymentLinkAsync(CreatePaymentLinkApiInput input, CancellationToken ct = default);
    Task<SimulateTransactionApiResult> SimulateTransactionAsync(SimulateTransactionApiInput input, CancellationToken ct = default);
    Task<ReprocessCompletedTransactionDevApiResult> ReprocessCompletedTransactionDevAsync(ReprocessCompletedTransactionDevApiInput input, CancellationToken ct = default);
    Task<ReprocessCompletedCashoutDevApiResult> ReprocessCompletedCashoutDevAsync(ReprocessCompletedCashoutDevApiInput input, CancellationToken ct = default);
    Task<ReprocessAcquirerWebhookDevApiResult> ReprocessAcquirerWebhookDevAsync(ReprocessAcquirerWebhookDevApiInput input, CancellationToken ct = default);
    Task<ForceAcquirerWebhookDevApiResult> ForceAcquirerWebhookDevAsync(ForceAcquirerWebhookDevApiInput input, CancellationToken ct = default);
    Task<ResendWebhookApiResult> ResendWebhookAsync(ResendWebhookApiInput input, CancellationToken ct = default);
    Task<CreateOrderApiResult> CreateOrderAsync(CreateOrderApiInput input, CancellationToken ct = default);
    Task<ReprocessCompletedPlatformPayoutItemDevApiResult> ReprocessCompletedPlatformPayoutItemDevAsync(ReprocessCompletedPlatformPayoutItemDevApiInput input, CancellationToken ct = default);
    Task<SubmitSubmerchantApiResult> SubmitSubmerchantAsync(SubmitSubmerchantApiInput input, CancellationToken ct = default);
    Task<GetSubmerchantStatusApiResult> GetSubmerchantStatusAsync(GetSubmerchantStatusApiInput input, CancellationToken ct = default);
    Task<SyncSubmerchantSplitConfigApiResult> SyncSubmerchantSplitConfigAsync(SyncSubmerchantSplitConfigApiInput input, CancellationToken ct = default);
}
