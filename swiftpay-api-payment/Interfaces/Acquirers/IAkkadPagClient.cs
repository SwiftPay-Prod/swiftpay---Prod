using swiftpay_api_payment.Clients;
using swiftpay_api_payment.Clients.AkkadPag.Models;

namespace swiftpay_api_payment.Interfaces.Acquirers;

public interface IAkkadPagClient
{
    Task<AcquirerClientResponse<AkkadPagPaymentResponse>> CreatePaymentAsync(string publicKey, string secretKey, AkkadPagPaymentRequest request);
    Task<AcquirerClientResponse<AkkadPagPaymentResponse>> GetPaymentAsync(string publicKey, string secretKey, string paymentId);
    Task<AcquirerClientResponse<AkkadPagWithdrawalResponse>> CreateTransferAsync(string publicKey, string secretKey, string withdrawalKey, AkkadPagWithdrawalRequest request);
    Task<AcquirerClientResponse<AkkadPagWithdrawalResponse>> GetTransferAsync(string publicKey, string secretKey, string transferId);
    Task<AcquirerClientResponse<AkkadPagCompanyDetailsResponse>> GetCompanyDetailsAsync(string publicKey, string secretKey);
}
