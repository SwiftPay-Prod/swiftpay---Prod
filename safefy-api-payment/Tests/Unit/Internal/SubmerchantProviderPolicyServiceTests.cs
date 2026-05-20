using FluentAssertions;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_payment.Interfaces.Internal;
using safefy_api_payment.Interfaces.Internal.Submerchants;
using safefy_api_payment.Services.Internal.Submerchants;

namespace safefy_api_payment.Tests.Unit.Internal;

public sealed class SubmerchantProviderPolicyServiceTests
{
    [Fact]
    public void GetCapabilities_ShouldMarkExternalAndLifecycleSupport_WhenProviderUsesSubmerchantAndHasAdapter()
    {
        var service = new SubmerchantProviderPolicyService(
            new SubmerchantProviderAdapterFactory([new FakeAccithusAdapter()]));

        var merchantAcquirer = CreateMerchantAcquirer(
            ProviderCategory.PaymentInstitution,
            AcquirerType.Accithus,
            "sub_123",
            ExternalSubmerchantStatus.Active);

        var capabilities = service.GetCapabilities(merchantAcquirer);

        capabilities.UsesExternalSubmerchant.Should().BeTrue();
        capabilities.SupportsLifecycle.Should().BeTrue();
        capabilities.SupportsSubmit.Should().BeTrue();
        capabilities.SupportsStatusSync.Should().BeTrue();
        capabilities.SupportsSplitConfigSync.Should().BeTrue();
    }

    [Fact]
    public void GetCapabilities_ShouldExposePartialOperations_WhenAdapterSupportsSubset()
    {
        var service = new SubmerchantProviderPolicyService(
            new SubmerchantProviderAdapterFactory([new FakePartialAdapter()]));

        var merchantAcquirer = CreateMerchantAcquirer(
            ProviderCategory.PaymentInstitution,
            AcquirerType.ActivePayments,
            "sub_123",
            ExternalSubmerchantStatus.Active);

        var capabilities = service.GetCapabilities(merchantAcquirer);

        capabilities.UsesExternalSubmerchant.Should().BeTrue();
        capabilities.SupportsLifecycle.Should().BeTrue();
        capabilities.SupportsSubmit.Should().BeFalse();
        capabilities.SupportsStatusSync.Should().BeTrue();
        capabilities.SupportsSplitConfigSync.Should().BeFalse();
    }

    [Fact]
    public void EvaluateRoutingReadiness_ShouldReturnNotRequired_WhenProviderDoesNotUseExternalSubmerchant()
    {
        var service = new SubmerchantProviderPolicyService(
            new SubmerchantProviderAdapterFactory([]));

        var merchantAcquirer = CreateMerchantAcquirer(
            ProviderCategory.Acquirer,
            AcquirerType.ActivePayments,
            null,
            ExternalSubmerchantStatus.NotSubmitted);

        var readiness = service.EvaluateRoutingReadiness(merchantAcquirer);

        readiness.IsReady.Should().BeTrue();
        readiness.Code.Should().Be(SubmerchantRoutingReadiness.NotRequiredCode);
    }

    [Fact]
    public void EvaluateRoutingReadiness_ShouldReturnNotOperational_WhenStatusIsNotActive()
    {
        var service = new SubmerchantProviderPolicyService(
            new SubmerchantProviderAdapterFactory([new FakeAccithusAdapter()]));

        var merchantAcquirer = CreateMerchantAcquirer(
            ProviderCategory.PaymentInstitution,
            AcquirerType.Accithus,
            "sub_123",
            ExternalSubmerchantStatus.PendingReview);

        var readiness = service.EvaluateRoutingReadiness(merchantAcquirer);

        readiness.IsReady.Should().BeFalse();
        readiness.Code.Should().Be(SubmerchantRoutingReadiness.ExternalSubmerchantNotOperationalCode);
    }

    private static MerchantAcquirer CreateMerchantAcquirer(
        ProviderCategory providerCategory,
        AcquirerType acquirerType,
        string? externalSubmerchantId,
        ExternalSubmerchantStatus externalSubmerchantStatus)
    {
        return new MerchantAcquirer
        {
            Acquirer = new Acquirer
            {
                Name = "Test Acquirer",
                Code = "test-acquirer",
                Type = acquirerType,
                ProviderCategory = providerCategory
            },
            ExternalSubmerchantId = externalSubmerchantId,
            ExternalSubmerchantStatus = externalSubmerchantStatus
        };
    }

    private sealed class FakeAccithusAdapter : ISubmerchantProviderAdapter
    {
        public AcquirerType AcquirerType => AcquirerType.Accithus;

        public SubmerchantProviderOperations Operations => SubmerchantProviderOperations.Full();

        public bool Supports(AcquirerConfigResult acquirerConfig)
            => acquirerConfig.AcquirerType == AcquirerType.Accithus;

        public Task<SubmerchantSubmitResult> SubmitAsync(
            AcquirerConfigResult acquirerConfig,
            SubmerchantSubmitInput input,
            CancellationToken ct = default)
            => Task.FromResult(new SubmerchantSubmitResult { Success = true });

        public Task<SubmerchantStatusResult> GetStatusAsync(
            AcquirerConfigResult acquirerConfig,
            string externalSubmerchantId,
            CancellationToken ct = default)
            => Task.FromResult(new SubmerchantStatusResult { Success = true });

        public Task<SubmerchantSplitConfigResult> SyncSplitConfigAsync(
            AcquirerConfigResult acquirerConfig,
            SubmerchantSplitConfigInput input,
            CancellationToken ct = default)
            => Task.FromResult(new SubmerchantSplitConfigResult { Success = true });
    }

    private sealed class FakePartialAdapter : ISubmerchantProviderAdapter
    {
        public AcquirerType AcquirerType => AcquirerType.ActivePayments;

        public SubmerchantProviderOperations Operations => new()
        {
            SupportsSubmit = false,
            SupportsStatusSync = true,
            SupportsSplitConfigSync = false
        };

        public bool Supports(AcquirerConfigResult acquirerConfig)
            => acquirerConfig.AcquirerType == AcquirerType.ActivePayments;

        public Task<SubmerchantSubmitResult> SubmitAsync(
            AcquirerConfigResult acquirerConfig,
            SubmerchantSubmitInput input,
            CancellationToken ct = default)
            => Task.FromResult(new SubmerchantSubmitResult { Success = false });

        public Task<SubmerchantStatusResult> GetStatusAsync(
            AcquirerConfigResult acquirerConfig,
            string externalSubmerchantId,
            CancellationToken ct = default)
            => Task.FromResult(new SubmerchantStatusResult { Success = true });

        public Task<SubmerchantSplitConfigResult> SyncSplitConfigAsync(
            AcquirerConfigResult acquirerConfig,
            SubmerchantSplitConfigInput input,
            CancellationToken ct = default)
            => Task.FromResult(new SubmerchantSplitConfigResult { Success = false });
    }
}