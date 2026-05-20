using safefy_api_payment.Clients;
using safefy_api_payment.Clients.Coldfy.Models.Payments;
using safefy_api_payment.Clients.Coldfy.Models.Withdrawals;

namespace safefy_api_payment.Interfaces.Acquirers;

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
