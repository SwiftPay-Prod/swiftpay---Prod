using swiftpay_api_payment.Clients;
using swiftpay_api_payment.Clients.HeartPay.Models.Boletos;
using swiftpay_api_payment.Clients.HeartPay.Models.Charges;
using swiftpay_api_payment.Clients.HeartPay.Models.Payouts;

namespace swiftpay_api_payment.Interfaces.Acquirers;

public interface IHeartPayClient
{
    Task<AcquirerClientResponse<HeartPayChargeData>> CreateChargeAsync(
        string baseUrl,
        string apiKey,
        HeartPayCreateChargeRequest request);

    Task<AcquirerClientResponse<HeartPayChargeData>> GetChargeAsync(
        string baseUrl,
        string apiKey,
        string chargeId);

    Task<AcquirerClientResponse<HeartPayBoletoData>> CreateBoletoAsync(
        string baseUrl,
        string apiKey,
        HeartPayCreateBoletoRequest request);

    Task<AcquirerClientResponse<HeartPayPayoutData>> CreatePayoutAsync(
        string baseUrl,
        string apiKey,
        HeartPayCreatePayoutRequest request);

    Task<AcquirerClientResponse<HeartPayPayoutData>> GetPayoutAsync(
        string baseUrl,
        string apiKey,
        string payoutId);
}
