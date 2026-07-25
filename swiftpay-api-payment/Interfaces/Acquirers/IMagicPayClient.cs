using swiftpay_api_payment.Clients;
using swiftpay_api_payment.Clients.MagicPay.Models;

namespace swiftpay_api_payment.Interfaces.Acquirers;

public interface IMagicPayClient
{
    Task<AcquirerClientResponse<MagicPayPaymentResponse>> CreatePaymentAsync(string baseUrl, string apiKey, MagicPayPaymentRequest request);
    Task<AcquirerClientResponse<MagicPayPaymentResponse>> GetPaymentAsync(string baseUrl, string apiKey, string paymentId);
    Task<AcquirerClientResponse<MagicPayPaymentResponse>> RefundPaymentAsync(string baseUrl, string apiKey, string paymentId);
    Task<AcquirerClientResponse<MagicPayTransferResponse>> CreateTransferAsync(string baseUrl, string apiKey, MagicPayTransferRequest request);
    Task<AcquirerClientResponse<MagicPayTransferResponse>> GetTransferAsync(string baseUrl, string apiKey, string transferId);
}
