using swiftpay_api_payment.Clients;
using swiftpay_api_payment.Clients.ActivePayments.Models.CreateBillet;
using swiftpay_api_payment.Clients.ActivePayments.Models.CreateCharge;
using swiftpay_api_payment.Clients.ActivePayments.Models.GetCharge;
using swiftpay_api_payment.Clients.ActivePayments.Models.Withdrawals;

namespace swiftpay_api_payment.Interfaces.Acquirers;

public interface IActivePaymentsClient
{
    Task<AcquirerClientResponse<ActivePaymentsCreateChargeResponse>> CreateChargeAsync(
        string baseUrl,
        string publicKey,
        string secretKey,
        ActivePaymentsCreateChargeRequest request);

    Task<AcquirerClientResponse<ActivePaymentsCreateBilletResponse>> CreateBilletAsync(
        string baseUrl,
        string publicKey,
        string secretKey,
        ActivePaymentsCreateBilletRequest request);

    Task<AcquirerClientResponse<ActivePaymentsGetChargeResponse>> GetChargeAsync(
        string baseUrl,
        string publicKey,
        string secretKey,
        string chargeIdOrExternalId);

    Task<AcquirerClientResponse<ActivePaymentsWithdrawResponse>> CreateWithdrawAsync(
        string baseUrl,
        string publicKey,
        string secretKey,
        ActivePaymentsWithdrawRequest request,
        string? withdrawalSecret = null);
}
