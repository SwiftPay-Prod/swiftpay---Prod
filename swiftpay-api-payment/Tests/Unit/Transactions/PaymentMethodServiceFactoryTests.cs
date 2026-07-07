using FluentAssertions;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_payment.Interfaces.Transactions;
using swiftpay_api_payment.Services.Transactions;

namespace swiftpay_api_payment.Tests.Unit.Transactions;

public sealed class PaymentMethodServiceFactoryTests
{
    [Fact]
    public void GetService_ShouldReturnServiceForPix()
    {
        var pixService = new FakePaymentMethodService(PaymentMethod.Pix);
        var boletoService = new FakePaymentMethodService(PaymentMethod.Boleto);
        var factory = new PaymentMethodServiceFactory([pixService, boletoService]);

        var service = factory.GetService(PaymentMethod.Pix);

        service.Should().NotBeNull();
        service!.Method.Should().Be(PaymentMethod.Pix);
    }

    [Fact]
    public void GetService_ShouldReturnNull_WhenMethodNotRegistered()
    {
        var pixService = new FakePaymentMethodService(PaymentMethod.Pix);
        var factory = new PaymentMethodServiceFactory([pixService]);

        var service = factory.GetService(PaymentMethod.Boleto);

        service.Should().BeNull();
    }

    [Fact]
    public void GetAvailableMethods_ShouldReturnRegisteredMethods()
    {
        var pixService = new FakePaymentMethodService(PaymentMethod.Pix);
        var boletoService = new FakePaymentMethodService(PaymentMethod.Boleto);
        var factory = new PaymentMethodServiceFactory([pixService, boletoService]);

        var methods = factory.GetAvailableMethods().ToList();

        methods.Should().Contain(PaymentMethod.Pix);
        methods.Should().Contain(PaymentMethod.Boleto);
        methods.Should().HaveCount(2);
    }

    private sealed class FakePaymentMethodService(PaymentMethod method) : IPaymentMethodService
    {
        public PaymentMethod Method { get; } = method;

        public Task<PaymentMethodResult> CreateAsync(PaymentMethodInput input, CancellationToken ct = default)
        {
            return Task.FromResult(new PaymentMethodResult { Success = true, Payment = new Payment() });
        }
    }
}
