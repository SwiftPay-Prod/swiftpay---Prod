using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using swiftpay_api_core.Models.Database;
using swiftpay_api_payment.Clients;
using swiftpay_api_payment.Clients.AkkadPag.Models;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_payment.Interfaces.Acquirers;
using swiftpay_api_payment.Services.Acquirers;

namespace swiftpay_api_payment.Tests.Unit.Transactions;

public sealed class AkkadPagServiceTests
{
    [Fact]
    public async Task GeneratedPix_ShouldPersistProviderIdUsedByStatusQuery()
    {
        const string providerPaymentId = "81158e9a-6433-430b-8895-d8bc00c3dfd5";
        var client = new StubAkkadPagClient(providerPaymentId);
        var service = new AkkadPagService(
            client,
            NullLogger<AkkadPagService>.Instance,
            null!,
            null!);
        var config = new AcquirerConfig
        {
            AcquirerId = Guid.NewGuid(),
            AcquirerType = AcquirerType.AkkadPag,
            ApiBaseUrl = "https://api.akkadpag.com/v1",
            PlatformBaseUrl = "https://swiftpayment.info",
            Credentials = new Dictionary<string, string>
            {
                ["publicKey"] = "public-key",
                ["secretKey"] = "secret-key"
            }
        };

        var generation = await service.GeneratePixAsync(config, new PixGenerationRequest
        {
            Amount = 500,
            CustomerName = "Cliente Teste",
            CustomerEmail = "cliente@example.com"
        });
        var status = await service.GetPixStatusAsync(config, generation.TxId!);

        generation.Success.Should().BeTrue();
        generation.AcquirerPaymentId.Should().Be(providerPaymentId);
        generation.TxId.Should().Be(providerPaymentId);
        client.QueriedPaymentId.Should().Be(providerPaymentId);
        status.Success.Should().BeTrue();
        status.Status.Should().Be(PaymentStatus.Pending);
    }

    private sealed class StubAkkadPagClient(string providerPaymentId) : IAkkadPagClient
    {
        public string? QueriedPaymentId { get; private set; }

        public Task<AcquirerClientResponse<AkkadPagPaymentResponse>> CreatePaymentAsync(
            string publicKey,
            string secretKey,
            AkkadPagPaymentRequest request)
        {
            return Task.FromResult(new AcquirerClientResponse<AkkadPagPaymentResponse>
            {
                Success = true,
                Data = new AkkadPagPaymentResponse
                {
                    Id = providerPaymentId,
                    Status = "WAITING_PAYMENT",
                    Pix = new AkkadPagPix
                    {
                        CopyPaste = "000201010212...",
                        ExpiresAt = DateTime.UtcNow.AddMinutes(30)
                    }
                }
            });
        }

        public Task<AcquirerClientResponse<AkkadPagPaymentDetailsResponse>> GetPaymentAsync(
            string publicKey,
            string secretKey,
            string paymentId)
        {
            QueriedPaymentId = paymentId;
            return Task.FromResult(new AcquirerClientResponse<AkkadPagPaymentDetailsResponse>
            {
                Success = true,
                Data = new AkkadPagPaymentDetailsResponse
                {
                    StatusCode = 200,
                    Data = new AkkadPagPaymentResponse
                    {
                        Id = paymentId,
                        Status = "WAITING_PAYMENT"
                    }
                }
            });
        }

        public Task<AcquirerClientResponse<AkkadPagWithdrawalResponse>> CreateTransferAsync(
            string publicKey,
            string secretKey,
            string withdrawalKey,
            AkkadPagWithdrawalRequest request) => throw new NotSupportedException();

        public Task<AcquirerClientResponse<AkkadPagWithdrawalResponse>> GetTransferAsync(
            string publicKey,
            string secretKey,
            string transferId) => throw new NotSupportedException();

        public Task<AcquirerClientResponse<AkkadPagCompanyDetailsResponse>> GetCompanyDetailsAsync(
            string publicKey,
            string secretKey) => throw new NotSupportedException();
    }
}
