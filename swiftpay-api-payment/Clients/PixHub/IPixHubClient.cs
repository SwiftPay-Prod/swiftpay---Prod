using swiftpay_api_payment.Clients.PixHub.Models;
using swiftpay_api_payment.Interfaces;

namespace swiftpay_api_payment.Clients.PixHub;

public interface IPixHubClient
{
    Task<AcquirerClientResponse<PixHubApiResponse<PixHubTransactionData>>> CreatePixQrCodeAsync(
        string apiKey,
        string apiSecret,
        PixHubCreatePixRequest request,
        CancellationToken ct = default);

    Task<AcquirerClientResponse<PixHubApiResponse<PixHubTransactionData>>> GetPixQrCodeAsync(
        string apiKey,
        string apiSecret,
        string transactionId,
        CancellationToken ct = default);

    Task<AcquirerClientResponse<PixHubApiResponse<PixHubTransferData>>> CreateTransferAsync(
        string apiKey,
        string apiSecret,
        string idempotencyKey,
        PixHubTransferRequest request,
        CancellationToken ct = default);

    Task<AcquirerClientResponse<PixHubApiResponse<PixHubTransferData>>> GetTransferAsync(
        string apiKey,
        string apiSecret,
        string transferId,
        CancellationToken ct = default);

    Task<AcquirerClientResponse<PixHubApiResponse<PixHubBalanceData>>> GetBalanceAsync(
        string apiKey,
        string apiSecret,
        CancellationToken ct = default);
}
