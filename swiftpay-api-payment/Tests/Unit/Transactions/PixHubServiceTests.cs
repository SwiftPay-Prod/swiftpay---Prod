using swiftpay_api_payment.Clients;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using swiftpay_api_core.Models.Database;
using swiftpay_api_payment.Clients.PixHub;
using swiftpay_api_payment.Clients.PixHub.Models;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_payment.Services.Acquirers;
using swiftpay_api_payment.Services.Acquirers.Utils;
using Xunit;

namespace swiftpay_api_payment.Tests.Unit.Transactions;

public sealed class PixHubServiceTests
{
    [Fact]
    public async Task GeneratePixAsync_WithValidCpf_ShouldReturnSuccessWithQrCode()
    {
        // Arrange
        const string transactionId = "trx_pixhub_12345";
        const string emvCode = "00020126580014br.gov.bcb.pix0136...";
        var client = new StubPixHubClient(transactionId, emvCode, "pending");
        var service = new PixHubService(client, NullLogger<PixHubService>.Instance);

        var config = new AcquirerConfig
        {
            AcquirerId = Guid.NewGuid(),
            AcquirerType = AcquirerType.PixHub,
            ApiBaseUrl = "https://api.usepixhub.com",
            PlatformBaseUrl = "https://swiftpayment.info",
            Credentials = new Dictionary<string, string>
            {
                ["apiKey"] = "test-api-key",
                ["apiSecret"] = "test-api-secret"
            }
        };

        var request = new PixGenerationRequest
        {
            Amount = 5000,
            CustomerName = "Comprador Teste",
            CustomerEmail = "comprador@example.com",
            CustomerDocument = "529.982.247-25",
            CustomerPhone = "(11) 99999-8888",
            Description = "Compra no Checkout"
        };

        // Act
        var result = await service.GeneratePixAsync(config, request);

        // Assert
        result.Success.Should().BeTrue();
        result.AcquirerPaymentId.Should().Be(transactionId);
        result.CopyAndPaste.Should().Be(emvCode);
        result.TxId.Should().Be(transactionId);
    }

    [Fact]
    public async Task GeneratePixAsync_WithInvalidDocument_ShouldFailValidation()
    {
        // Arrange
        var client = new StubPixHubClient("trx_123", "emv", "pending");
        var service = new PixHubService(client, NullLogger<PixHubService>.Instance);

        var config = new AcquirerConfig
        {
            AcquirerId = Guid.NewGuid(),
            AcquirerType = AcquirerType.PixHub,
            ApiBaseUrl = "https://api.usepixhub.com",
            PlatformBaseUrl = "https://swiftpayment.info",
            Credentials = new Dictionary<string, string>
            {
                ["apiKey"] = "test-api-key",
                ["apiSecret"] = "test-api-secret"
            }
        };

        var request = new PixGenerationRequest
        {
            Amount = 5000,
            CustomerName = "Comprador Teste",
            CustomerDocument = "00000000000" // Invalid CPF
        };

        // Act
        var result = await service.GeneratePixAsync(config, request);

        // Assert
        result.Success.Should().BeFalse();
        result.ErrorMessage.Should().Contain("inválido");
    }

    [Theory]
    [InlineData("paid", PaymentStatus.Completed)]
    [InlineData("completed", PaymentStatus.Completed)]
    [InlineData("pending", PaymentStatus.Pending)]
    [InlineData("waiting_payment", PaymentStatus.Pending)]
    [InlineData("canceled", PaymentStatus.Failed)]
    [InlineData("refunded", PaymentStatus.Refunded)]
    public void StatusConverter_Transaction_MapsCorrectly(string externalStatus, PaymentStatus expectedStatus)
    {
        var status = PixHubStatusConverter.ConvertTransactionStatus(externalStatus);
        status.Should().Be(expectedStatus);
    }

    [Theory]
    [InlineData("completed", PayoutStatus.Completed)]
    [InlineData("pending", PayoutStatus.Processing)]
    [InlineData("processing", PayoutStatus.Processing)]
    [InlineData("manual_analysis", PayoutStatus.Pending)]
    [InlineData("canceled", PayoutStatus.Failed)]
    [InlineData("banking_error", PayoutStatus.Failed)]
    public void StatusConverter_Transfer_MapsCorrectly(string externalStatus, PayoutStatus expectedStatus)
    {
        var status = PixHubStatusConverter.ConvertTransferStatus(externalStatus);
        status.Should().Be(expectedStatus);
    }

    private sealed class StubPixHubClient(string transactionId, string emv, string status) : IPixHubClient
    {
        public Task<AcquirerClientResponse<PixHubApiResponse<PixHubTransactionData>>> CreatePixQrCodeAsync(
            string apiKey,
            string apiSecret,
            PixHubCreatePixRequest request,
            CancellationToken ct = default)
        {
            return Task.FromResult(new AcquirerClientResponse<PixHubApiResponse<PixHubTransactionData>>
            {
                Success = true,
                StatusCode = 200,
                Data = new PixHubApiResponse<PixHubTransactionData>
                {
                    Success = true,
                    Data = new PixHubTransactionData
                    {
                        Id = transactionId,
                        Status = status,
                        Pix = new PixHubPixData
                        {
                            Emv = emv,
                            QrCode = emv
                        }
                    }
                }
            });
        }

        public Task<AcquirerClientResponse<PixHubApiResponse<PixHubTransactionData>>> GetPixQrCodeAsync(
            string apiKey,
            string apiSecret,
            string txId,
            CancellationToken ct = default)
        {
            return Task.FromResult(new AcquirerClientResponse<PixHubApiResponse<PixHubTransactionData>>
            {
                Success = true,
                StatusCode = 200,
                Data = new PixHubApiResponse<PixHubTransactionData>
                {
                    Success = true,
                    Data = new PixHubTransactionData
                    {
                        Id = txId,
                        Status = status
                    }
                }
            });
        }

        public Task<AcquirerClientResponse<PixHubApiResponse<PixHubTransferData>>> CreateTransferAsync(
            string apiKey,
            string apiSecret,
            string idempotencyKey,
            PixHubTransferRequest request,
            CancellationToken ct = default) => throw new NotImplementedException();

        public Task<AcquirerClientResponse<PixHubApiResponse<PixHubTransferData>>> GetTransferAsync(
            string apiKey,
            string apiSecret,
            string transferId,
            CancellationToken ct = default) => throw new NotImplementedException();

        public Task<AcquirerClientResponse<PixHubApiResponse<PixHubBalanceData>>> GetBalanceAsync(
            string apiKey,
            string apiSecret,
            CancellationToken ct = default) => throw new NotImplementedException();
    }
}
