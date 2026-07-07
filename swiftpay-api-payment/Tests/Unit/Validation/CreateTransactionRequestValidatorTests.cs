using FluentAssertions;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_payment.Endpoints.Transactions.Create;

namespace swiftpay_api_payment.Tests.Unit.Validation;

public sealed class CreateTransactionRequestValidatorTests
{
    private readonly CreateTransactionRequestValidator _validator = new();

    [Fact]
    public void Should_Accept_ValidPixRequest()
    {
        var request = new CreateTransactionRequest
        {
            Method = PaymentMethod.Pix,
            Amount = 10000,
            Currency = CurrencyType.BRL,
            PixExpirationMinutes = 30,
            CallbackUrl = "https://merchant.test/callback"
        };

        var result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Should_Reject_PixExpirationOutsideRange()
    {
        var request = new CreateTransactionRequest
        {
            Method = PaymentMethod.Pix,
            Amount = 10000,
            Currency = CurrencyType.BRL,
            PixExpirationMinutes = 3
        };

        var result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Any(e => e.PropertyName == nameof(CreateTransactionRequest.PixExpirationMinutes)).Should().BeTrue();
    }

    [Fact]
    public void Should_Require_CardNumber_ForCreditCard()
    {
        var request = new CreateTransactionRequest
        {
            Method = PaymentMethod.CreditCard,
            Amount = 10000,
            Currency = CurrencyType.BRL,
            CardNumber = null,
            CardHolderName = "John Doe",
            CardExpirationMonth = 12,
            CardExpirationYear = DateTime.UtcNow.Year + 1,
            CardCvv = "123"
        };

        var result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Any(e => e.PropertyName == nameof(CreateTransactionRequest.CardNumber)).Should().BeTrue();
    }

    [Fact]
    public void Should_Require_FutureDueDate_ForBoleto()
    {
        var request = new CreateTransactionRequest
        {
            Method = PaymentMethod.Boleto,
            Amount = 10000,
            Currency = CurrencyType.BRL,
            CustomerId = Guid.NewGuid(),
            BoletoDueDate = DateTime.Today.AddDays(-1)
        };

        var result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Any(e => e.PropertyName == nameof(CreateTransactionRequest.BoletoDueDate)).Should().BeTrue();
    }

    [Fact]
    public void Should_Require_Customer_ForBoleto_WhenNameMissing()
    {
        var request = new CreateTransactionRequest
        {
            Method = PaymentMethod.Boleto,
            Amount = 10000,
            Currency = CurrencyType.BRL,
            CustomerName = null,
            CustomerId = null,
            BoletoDueDate = DateTime.Today.AddDays(2)
        };

        var result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Any(e => e.PropertyName == nameof(CreateTransactionRequest.CustomerId)).Should().BeTrue();
    }

    [Fact]
    public void Should_Reject_Invalid_CallbackUrl()
    {
        var request = new CreateTransactionRequest
        {
            Method = PaymentMethod.Pix,
            Amount = 10000,
            Currency = CurrencyType.BRL,
            CallbackUrl = "not-a-url"
        };

        var result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Any(e => e.PropertyName == nameof(CreateTransactionRequest.CallbackUrl)).Should().BeTrue();
    }
}
