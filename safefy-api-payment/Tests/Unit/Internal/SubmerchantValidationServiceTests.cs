using FluentAssertions;
using safefy_api_core.Constants;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_payment.Interfaces.Internal.Submerchants;
using safefy_api_payment.Services.Internal;
using safefy_api_payment.Services.Internal.Submerchants;

namespace safefy_api_payment.Tests.Unit.Internal;

public sealed class SubmerchantValidationServiceTests
{
    private readonly SubmerchantValidationService _service = new(
        new SubmerchantProviderPolicyService(
            new SubmerchantProviderAdapterFactory([])));

    [Fact]
    public void ValidateForPayment_ShouldBeValid_WhenProviderDoesNotUseExternalSubmerchant()
    {
        var merchantAcquirer = CreateMerchantAcquirer(
            ProviderCategory.Acquirer,
            null,
            ExternalSubmerchantStatus.NotSubmitted);

        var result = _service.ValidateForPayment(merchantAcquirer, PaymentMethod.Pix);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void ValidateForPayment_ShouldBeInvalid_WhenExternalSubmerchantIdIsMissing()
    {
        var merchantAcquirer = CreateMerchantAcquirer(
            ProviderCategory.PaymentInstitution,
            null,
            ExternalSubmerchantStatus.Active);

        var result = _service.ValidateForPayment(merchantAcquirer, PaymentMethod.Boleto);

        result.IsValid.Should().BeFalse();
        result.ErrorCode.Should().Be(PaymentApiErrorCodes.ExternalSubmerchantNotActive);
        result.StatusCode.Should().Be(400);
    }

    [Fact]
    public void ValidateForPayment_ShouldBeInvalid_WhenExternalSubmerchantIsNotActive()
    {
        var merchantAcquirer = CreateMerchantAcquirer(
            ProviderCategory.PaymentInstitution,
            "sub_123",
            ExternalSubmerchantStatus.PendingReview);

        var result = _service.ValidateForPayment(merchantAcquirer, PaymentMethod.CreditCard);

        result.IsValid.Should().BeFalse();
        result.ErrorCode.Should().Be(PaymentApiErrorCodes.ExternalSubmerchantNotActive);
        result.StatusCode.Should().Be(400);
    }

    [Fact]
    public void ValidateForPayment_ShouldBeValid_WhenExternalSubmerchantIsActive()
    {
        var merchantAcquirer = CreateMerchantAcquirer(
            ProviderCategory.PaymentInstitution,
            "sub_123",
            ExternalSubmerchantStatus.Active);

        var result = _service.ValidateForPayment(merchantAcquirer, PaymentMethod.Pix);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void IsReadyForRouting_ShouldBeFalse_WhenExternalSubmerchantIdIsMissing()
    {
        var merchantAcquirer = CreateMerchantAcquirer(
            ProviderCategory.PaymentInstitution,
            null,
            ExternalSubmerchantStatus.Active);

        var result = _service.IsReadyForRouting(merchantAcquirer);

        result.Should().BeFalse();
    }

    [Fact]
    public void IsReadyForRouting_ShouldBeFalse_WhenStatusIsNotActive()
    {
        var merchantAcquirer = CreateMerchantAcquirer(
            ProviderCategory.PaymentInstitution,
            "sub_123",
            ExternalSubmerchantStatus.Pending);

        var result = _service.IsReadyForRouting(merchantAcquirer);

        result.Should().BeFalse();
    }

    [Fact]
    public void IsReadyForRouting_ShouldBeTrue_WhenStatusIsActiveAndIdExists()
    {
        var merchantAcquirer = CreateMerchantAcquirer(
            ProviderCategory.PaymentInstitution,
            "sub_123",
            ExternalSubmerchantStatus.Active);

        var result = _service.IsReadyForRouting(merchantAcquirer);

        result.Should().BeTrue();
    }

    [Fact]
    public void GetRoutingReadiness_ShouldReturnMissingIdCode_WhenExternalIdIsMissing()
    {
        var merchantAcquirer = CreateMerchantAcquirer(
            ProviderCategory.PaymentInstitution,
            null,
            ExternalSubmerchantStatus.Pending);

        var result = _service.GetRoutingReadiness(merchantAcquirer);

        result.IsReady.Should().BeFalse();
        result.Code.Should().Be(SubmerchantRoutingReadiness.MissingExternalSubmerchantIdCode);
    }

    [Fact]
    public void GetRoutingReadiness_ShouldReturnReadyCode_WhenExternalSubmerchantIsOperational()
    {
        var merchantAcquirer = CreateMerchantAcquirer(
            ProviderCategory.PaymentInstitution,
            "sub_123",
            ExternalSubmerchantStatus.Active);

        var result = _service.GetRoutingReadiness(merchantAcquirer);

        result.IsReady.Should().BeTrue();
        result.Code.Should().Be(SubmerchantRoutingReadiness.ReadyCode);
    }

    private static MerchantAcquirer CreateMerchantAcquirer(
        ProviderCategory providerCategory,
        string? externalSubmerchantId,
        ExternalSubmerchantStatus externalSubmerchantStatus)
    {
        return new MerchantAcquirer
        {
            Acquirer = new Acquirer
            {
                Name = "Test Acquirer",
                Code = "test-acquirer",
                Type = AcquirerType.Accithus,
                ProviderCategory = providerCategory
            },
            ExternalSubmerchantId = externalSubmerchantId,
            ExternalSubmerchantStatus = externalSubmerchantStatus
        };
    }
}