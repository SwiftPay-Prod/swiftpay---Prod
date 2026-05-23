using Swiftpay.Api.Core.Services;

namespace Swiftpay.Application.Tests.Services;

public class FeeCalculationServiceTests
{
    private readonly FeeCalculationService _calc = new();

    [Fact]
    public void CalculatePixFees_Should_ComputeAllValues()
    {
        var r = _calc.CalculatePixFees(10000);

        r.PlatformFee.Should().Be(680);     // 500 + 180
        r.AcquirerFee.Should().Be(400);      // 300 + 100
        r.MerchantSettlementAmount.Should().Be(9320);
        r.NetAmount.Should().Be(8920);
    }

    [Fact]
    public void CalculatePixFees_Should_HandleZero()
    {
        var r = _calc.CalculatePixFees(0);

        r.PlatformFee.Should().Be(0);
        r.MerchantSettlementAmount.Should().Be(0);
    }
}
