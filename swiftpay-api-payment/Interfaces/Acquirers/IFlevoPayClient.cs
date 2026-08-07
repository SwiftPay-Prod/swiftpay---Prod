using swiftpay_api_payment.Clients;
using swiftpay_api_payment.Clients.FlevoPay.Models;

namespace swiftpay_api_payment.Interfaces.Acquirers;

public interface IFlevoPayClient
{
    Task<AcquirerClientResponse<FlevoPayPaymentResponse>> CreatePaymentAsync(string apiKey, FlevoPayPaymentRequest request);
    Task<AcquirerClientResponse<FlevoPayTransactionQueryResponse>> GetPaymentAsync(string apiKey, string transactionId);
    Task<AcquirerClientResponse<FlevoPaySellerResponse>> GetSellerAsync(string apiKey);
}