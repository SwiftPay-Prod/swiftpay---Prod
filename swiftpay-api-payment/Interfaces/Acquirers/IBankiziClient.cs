using safefy_api_payment.Clients;
using safefy_api_payment.Clients.Bankizi.Models.CreatePix;
using safefy_api_payment.Clients.Bankizi.Models.GetPix;
using safefy_api_payment.Clients.Bankizi.Models.Token;
using safefy_api_payment.Clients.Bankizi.Models.Withdrawals;

namespace safefy_api_payment.Interfaces.Acquirers;

public interface IBankiziClient
{
    Task<AcquirerClientResponse<BankiziTokenResponse>> GetTokenAsync(string baseUrl, string clientId, string clientSecret);
    Task<AcquirerClientResponse<BankiziCreatePixResponse>> CreatePixAsync(string baseUrl, string accessToken, BankiziCreatePixRequest request);
    Task<AcquirerClientResponse<BankiziGetPixResponse>> GetPixAsync(string baseUrl, string accessToken, string txId);
    Task<AcquirerClientResponse<BankiziWithdrawResponse>> WithdrawAsync(string baseUrl, string accessToken, BankiziWithdrawRequest request);
}
