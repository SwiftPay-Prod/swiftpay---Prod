using swiftpay_api_payment.Clients;
using swiftpay_api_payment.Clients.Bankizi.Models.CreatePix;
using swiftpay_api_payment.Clients.Bankizi.Models.GetPix;
using swiftpay_api_payment.Clients.Bankizi.Models.Token;
using swiftpay_api_payment.Clients.Bankizi.Models.Withdrawals;

namespace swiftpay_api_payment.Interfaces.Acquirers;

public interface IBankiziClient
{
    Task<AcquirerClientResponse<BankiziTokenResponse>> GetTokenAsync(string baseUrl, string clientId, string clientSecret);
    Task<AcquirerClientResponse<BankiziCreatePixResponse>> CreatePixAsync(string baseUrl, string accessToken, BankiziCreatePixRequest request);
    Task<AcquirerClientResponse<BankiziGetPixResponse>> GetPixAsync(string baseUrl, string accessToken, string txId);
    Task<AcquirerClientResponse<BankiziWithdrawResponse>> WithdrawAsync(string baseUrl, string accessToken, BankiziWithdrawRequest request);
}
