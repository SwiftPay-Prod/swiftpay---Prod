using FluentAssertions;
using swiftpay_api_payment.Endpoints.Auth.Token;

namespace swiftpay_api_payment.Tests.Unit.Validation;

public sealed class TokenRequestValidatorTests
{
    private readonly TokenRequestValidator _validator = new();

    [Fact]
    public void Should_Accept_ValidClientCredentialsRequest()
    {
        var request = new TokenRequest
        {
            GrantType = "client_credentials",
            PublicKey = "pk_sandbox_test",
            SecretKey = "sk_sandbox_test"
        };

        var result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Should_Reject_InvalidGrantType()
    {
        var request = new TokenRequest
        {
            GrantType = "password",
            PublicKey = "pk_sandbox_test",
            SecretKey = "sk_sandbox_test"
        };

        var result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Any(e => e.PropertyName == nameof(TokenRequest.GrantType)).Should().BeTrue();
    }

    [Fact]
    public void Should_Reject_EmptyPublicKey()
    {
        var request = new TokenRequest
        {
            GrantType = "client_credentials",
            PublicKey = string.Empty,
            SecretKey = "sk_sandbox_test"
        };

        var result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Any(e => e.PropertyName == nameof(TokenRequest.PublicKey)).Should().BeTrue();
    }
}
