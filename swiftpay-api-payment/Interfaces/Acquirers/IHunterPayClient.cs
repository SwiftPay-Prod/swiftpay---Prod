using swiftpay_api_payment.Clients;
using swiftpay_api_payment.Clients.HunterPay.Models.Transactions;
using swiftpay_api_payment.Clients.HunterPay.Models.Withdrawals;

namespace swiftpay_api_payment.Interfaces.Acquirers;

public interface IHunterPayClient
{
    Task<AcquirerClientResponse<HunterPayTransactionData>> CreateTransactionAsync(
        string baseUrl,
        string apiKey,
        string? companyId,
        HunterPayCreateTransactionRequest request);

    Task<AcquirerClientResponse<HunterPayTransactionData>> GetTransactionAsync(
        string baseUrl,
        string apiKey,
        string? companyId,
        string transactionId);

    Task<AcquirerClientResponse<HunterPayWithdrawalResponse>> CreateWithdrawalAsync(
        string baseUrl,
        string apiKey,
        string? companyId,
        string idempotencyKey,
        HunterPayCreateWithdrawalRequest request);
}
