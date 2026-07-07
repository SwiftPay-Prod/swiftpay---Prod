using FluentAssertions;
using swiftpay_api_payment.Endpoints.Cashouts.Create;

namespace swiftpay_api_payment.Tests.Unit.Validation;

public sealed class CreateCashoutRequestValidatorTests
{
    private readonly CreateCashoutRequestValidator _validator = new();

    [Fact]
    public void Should_Accept_WithPayoutAccountId()
    {
        var request = new CreateCashoutRequest
        {
            Amount = 5000,
            PayoutAccountId = Guid.NewGuid()
        };

        var result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Should_Accept_WithInlinePixKey()
    {
        var request = new CreateCashoutRequest
        {
            Amount = 5000,
            PixKeyType = "Email",
            PixKey = "cashout@test.com"
        };

        var result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Should_Reject_WhenPayoutAccountAndPixProvidedTogether()
    {
        var request = new CreateCashoutRequest
        {
            Amount = 5000,
            PayoutAccountId = Guid.NewGuid(),
            PixKeyType = "Email",
            PixKey = "cashout@test.com"
        };

        var result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Should_Reject_WhenNoDestinationProvided()
    {
        var request = new CreateCashoutRequest
        {
            Amount = 5000,
            PayoutAccountId = null,
            PixKeyType = null,
            PixKey = null
        };

        var result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Should_Reject_InvalidPixKeyType()
    {
        var request = new CreateCashoutRequest
        {
            Amount = 5000,
            PixKeyType = "InvalidType",
            PixKey = "cashout@test.com"
        };

        var result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Any(e => e.PropertyName == nameof(CreateCashoutRequest.PixKeyType)).Should().BeTrue();
    }

    [Fact]
    public void Should_Reject_InvalidCallbackUrl()
    {
        var request = new CreateCashoutRequest
        {
            Amount = 5000,
            PayoutAccountId = Guid.NewGuid(),
            CallbackUrl = "invalid-url"
        };

        var result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Any(e => e.PropertyName == nameof(CreateCashoutRequest.CallbackUrl)).Should().BeTrue();
    }
}
