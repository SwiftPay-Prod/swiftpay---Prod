using safefy_api_payment.Clients;
using safefy_api_payment.Clients.Rapdyn.Models.Payments;
using safefy_api_payment.Clients.Rapdyn.Models.Withdrawals;

namespace safefy_api_payment.Interfaces.Acquirers;

public interface IRapdynClient
{
    Task<AcquirerClientResponse<RapdynPaymentResponse>> CreatePaymentAsync(string baseUrl, string token, RapdynCreatePaymentRequest request);
    Task<AcquirerClientResponse<RapdynGetTransactionResponse>> GetTransactionAsync(string baseUrl, string token, string transactionId);
    Task<AcquirerClientResponse<RapdynTransferResponse>> CreateTransferAsync(string baseUrl, string token, RapdynCreateTransferRequest request);
}
