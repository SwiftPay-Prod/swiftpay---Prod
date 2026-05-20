using safefy_api_payment.Clients;
using safefy_api_payment.Clients.Accithus.Models.CreateTransaction;
using safefy_api_payment.Clients.Accithus.Models.GetTransaction;
using safefy_api_payment.Clients.Accithus.Models.Submerchant;
using safefy_api_payment.Clients.Accithus.Models.Withdrawals;

namespace safefy_api_payment.Interfaces.Acquirers;

public interface IAccithusClient
{
    Task<AcquirerClientResponse<AccithusCreateTransactionResponse>> CreateTransactionAsync(
        string baseUrl, string authHeader, AccithusCreateTransactionRequest request);

    Task<AcquirerClientResponse<AccithusGetTransactionResponse>> GetTransactionAsync(
        string baseUrl, string authHeader, string transactionId);

    Task<AcquirerClientResponse<AccithusWithdrawResponse>> WithdrawAsync(
        string baseUrl, string authHeader, AccithusWithdrawRequest request, string idempotencyKey);

    Task<AcquirerClientResponse<AccithusSubmerchantResponse>> CreateSubmerchantAsync(
        string baseUrl, string authHeader, AccithusCreateSubmerchantRequest request);

    Task<AcquirerClientResponse<AccithusSubmerchantResponse>> UpdateSubmerchantAsync(
        string baseUrl, string authHeader, string submerchantId, AccithusUpdateSubmerchantRequest request);

    Task<AcquirerClientResponse<AccithusSubmerchantResponse>> ResubmitSubmerchantAsync(
        string baseUrl, string authHeader, string submerchantId, AccithusResubmitSubmerchantRequest request);

    Task<AcquirerClientResponse<AccithusSubmerchantResponse>> GetSubmerchantAsync(
        string baseUrl, string authHeader, string submerchantId);

    Task<AcquirerClientResponse<AccithusSubmerchantDocumentResponse>> AddSubmerchantDocumentAsync(
        string baseUrl, string authHeader, string submerchantId, AccithusCreateSubmerchantDocumentRequest request);

    Task<AcquirerClientResponse<AccithusSubmerchantAddressResponse>> AddSubmerchantAddressAsync(
        string baseUrl, string authHeader, string submerchantId, AccithusCreateSubmerchantAddressRequest request);

    Task<AcquirerClientResponse<AccithusSubmerchantSplitConfigResponse>> GetSubmerchantSplitConfigAsync(
        string baseUrl, string authHeader, string submerchantId);

    Task<AcquirerClientResponse<AccithusSubmerchantSplitConfigResponse>> CreateSubmerchantSplitConfigAsync(
        string baseUrl, string authHeader, string submerchantId, AccithusUpsertSubmerchantSplitConfigRequest request);

    Task<AcquirerClientResponse<AccithusSubmerchantSplitConfigResponse>> UpdateSubmerchantSplitConfigAsync(
        string baseUrl, string authHeader, string submerchantId, AccithusUpsertSubmerchantSplitConfigRequest request);
}
