using swiftpay_api_payment.Clients;
using swiftpay_api_payment.Clients.Coldfy.Models.Payments;
using swiftpay_api_payment.Clients.Coldfy.Models.Withdrawals;

namespace swiftpay_api_payment.Interfaces.Acquirers;

public interface IColdfyClient
{
    Task<AcquirerClientResponse<ColdfyPaymentResponse>> CreatePaymentAsync(
        string baseUrl,
        string apiKey,
        string companyId,
        ColdfyCreatePaymentRequest request);

    Task<AcquirerClientResponse<ColdfyPaymentResponse>> GetTransactionAsync(
        string baseUrl,
        string apiKey,
        string companyId,
        string transactionId);

    Task<AcquirerClientResponse<ColdfyWithdrawalResponse>> CreateWithdrawalAsync(
        string baseUrl,
        string apiKey,
        string companyId,
        string idempotencyKey,
        ColdfyCreateWithdrawalRequest request);
}
