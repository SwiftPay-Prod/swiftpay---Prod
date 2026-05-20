using safefy_api_payment.Clients;
using safefy_api_payment.Clients.Pluggou.Models;
using safefy_api_payment.Clients.Pluggou.Models.Transactions;
using safefy_api_payment.Clients.Pluggou.Models.Withdrawals;

namespace safefy_api_payment.Interfaces.Acquirers;

public interface IPluggouClient
{
    Task<AcquirerClientResponse<PluggouApiResponse<PluggouTransactionData>>> CreateTransactionAsync(
        string baseUrl,
        string publicKey,
        string secretKey,
        PluggouCreateTransactionRequest request);

    Task<AcquirerClientResponse<PluggouApiResponse<PluggouTransactionData>>> GetTransactionAsync(
        string baseUrl,
        string publicKey,
        string secretKey,
        string transactionId);

    Task<AcquirerClientResponse<PluggouApiResponse<PluggouWithdrawalData>>> CreateWithdrawalAsync(
        string baseUrl,
        string publicKey,
        string secretKey,
        PluggouCreateWithdrawalRequest request);
}
