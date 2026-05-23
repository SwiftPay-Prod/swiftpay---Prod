using Swiftpay.Api.Core.Providers.MagicPay;

namespace Swiftpay.Infrastructure.Tests.Providers;

public class MagicPayResponseParserTests
{
    private readonly MagicPayResponseParser _parser = new();

    [Fact]
    public void ParseCreatePaymentResponse_Should_ExtractPixData()
    {
        var json = """{"id":"pay_abc123","amount":5000,"status":"PENDING","data":{"copypaste":"000201010212...","e2e":"E123"},"payer":{"name":"John","taxId":"123"}}""";
        var result = _parser.ParseCreatePaymentResponse(json);

        result.Success.Should().BeTrue();
        result.TransactionId.Should().Be("pay_abc123");
        result.CopyAndPaste.Should().Be("000201010212...");
    }

    [Fact]
    public void ParseCreatePaymentResponse_Should_ReturnError_When_ErrorResponse()
    {
        var json = """{"error":"invalid_amount","message":"Amount must be positive"}""";
        var result = _parser.ParseCreatePaymentResponse(json);

        result.Success.Should().BeFalse();
        result.ErrorMessage.Should().Contain("invalid_amount");
    }
}
