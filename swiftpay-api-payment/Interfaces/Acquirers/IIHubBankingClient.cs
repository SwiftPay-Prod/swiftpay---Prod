using swiftpay_api_payment.Clients;
using swiftpay_api_payment.Clients.IHubBanking.Models.Transactions;
using swiftpay_api_payment.Clients.IHubBanking.Models.Withdrawals;

namespace swiftpay_api_payment.Interfaces.Acquirers;

/// <summary>
/// Interface para o client HTTP do IHub Banking.
/// </summary>
public interface IIHubBankingClient
{
    /// <summary>
    /// Cria uma transação PIX para recebimento.
    /// POST /transactions/v2/purchase
    /// </summary>
    Task<AcquirerClientResponse<IHubCreateTransactionResponse>> CreateTransactionAsync(string baseUrl, string secretKey, IHubCreateTransactionRequest request);

    /// <summary>
    /// Consulta o status de uma transação.
    /// GET /transactions/:transactionId
    /// </summary>
    Task<AcquirerClientResponse<IHubGetTransactionResponse>> GetTransactionAsync(string baseUrl, string secretKey, string transactionId, string searchBy = "id");

    /// <summary>
    /// Cria um saque (cash-out) via chave PIX.
    /// POST /withdraws/cash-out
    /// </summary>
    Task<AcquirerClientResponse<IHubWithdrawResponse>> WithdrawAsync(string baseUrl, string secretKey, IHubWithdrawRequest request);

    /// <summary>
    /// Consulta o status de um saque.
    /// GET /withdraws/collect/:withdrawId
    /// </summary>
    Task<AcquirerClientResponse<IHubGetWithdrawResponse>> GetWithdrawAsync(string baseUrl, string secretKey, string withdrawId, string searchBy = "id");
}
