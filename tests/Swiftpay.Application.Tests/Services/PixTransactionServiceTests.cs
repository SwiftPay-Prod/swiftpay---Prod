using MassTransit;
using Swiftpay.Api.Core.Common;
using Swiftpay.Api.Core.Providers;
using Swiftpay.Api.Core.Services;
using Swiftpay.Application.Common;
using Swiftpay.Domain.Entities;

namespace Swiftpay.Application.Tests.Services;

public class PixTransactionServiceTests
{
    private readonly Mock<IPaymentRepository> _repo = new();
    private readonly Mock<IPixProvider> _provider = new();
    private readonly Mock<IPublishEndpoint> _publish = new();
    private readonly Mock<IUnitOfWork> _uow = new();
    private readonly FeeCalculationService _calc = new();
    private readonly PixTransactionService _service;
    private readonly Guid _merchantId = Guid.NewGuid();

    public PixTransactionServiceTests()
    {
        _service = new PixTransactionService(
            _repo.Object, _provider.Object, _publish.Object, _uow.Object, _calc);
    }

    [Fact]
    public async Task CreatePixPaymentAsync_Should_CreatePaymentAndGeneratePix()
    {
        _provider.Setup(p => p.GeneratePixAsync(It.IsAny<PixGenerationRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PixGenerationResult(true, "pay_abc", null, "000201010212...", null));

        var result = await _service.CreatePixPaymentAsync(
            _merchantId, 3000, "order_123", "https://webhook.url",
            "John", "12345678901", "john@test.com", "11999999999", CancellationToken.None);

        result.Success.Should().BeTrue();
        result.CopyAndPaste.Should().Be("000201010212...");

        _repo.Verify(r => r.AddAsync(It.Is<Payment>(p => p.Amount == 3000), It.IsAny<CancellationToken>()));
    }

    [Fact]
    public async Task CreatePixPaymentAsync_Should_ReturnError_When_ProviderFails()
    {
        _provider.Setup(p => p.GeneratePixAsync(It.IsAny<PixGenerationRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PixGenerationResult(false, null, null, null, "Provider error"));

        var result = await _service.CreatePixPaymentAsync(
            _merchantId, 3000, "order_456", "https://webhook.url",
            "John", "123", "j@t.com", "111", CancellationToken.None);

        result.Success.Should().BeFalse();
        result.ErrorMessage.Should().Be("Provider error");
    }
}
