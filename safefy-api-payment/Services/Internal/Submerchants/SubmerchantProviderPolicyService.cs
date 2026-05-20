using safefy_api_core.Models.Database;
using safefy_api_core.Utils;
using safefy_api_payment.Interfaces.Internal.Submerchants;

namespace safefy_api_payment.Services.Internal.Submerchants;

public sealed class SubmerchantProviderPolicyService(
    ISubmerchantProviderAdapterFactory submerchantProviderAdapterFactory
) : ISubmerchantProviderPolicyService
{
    public SubmerchantProviderCapabilities GetCapabilities(MerchantAcquirer merchantAcquirer)
    {
        var usesExternalSubmerchant = ExternalSubmerchantUtils.UsesExternalSubmerchant(merchantAcquirer.Acquirer.ProviderCategory);
        var operations = submerchantProviderAdapterFactory.GetOperations(merchantAcquirer.Acquirer.Type);

        return new SubmerchantProviderCapabilities
        {
            UsesExternalSubmerchant = usesExternalSubmerchant,
            SupportsLifecycle = operations.SupportsLifecycle,
            SupportsSubmit = operations.SupportsSubmit,
            SupportsStatusSync = operations.SupportsStatusSync,
            SupportsSplitConfigSync = operations.SupportsSplitConfigSync
        };
    }

    public SubmerchantRoutingReadiness EvaluateRoutingReadiness(MerchantAcquirer merchantAcquirer)
    {
        var capabilities = GetCapabilities(merchantAcquirer);
        if (!capabilities.UsesExternalSubmerchant)
            return SubmerchantRoutingReadiness.NotRequired();

        if (string.IsNullOrWhiteSpace(merchantAcquirer.ExternalSubmerchantId))
            return SubmerchantRoutingReadiness.MissingExternalSubmerchantId(merchantAcquirer.ExternalSubmerchantStatus);

        if (!ExternalSubmerchantUtils.IsOperational(merchantAcquirer.ExternalSubmerchantStatus))
            return SubmerchantRoutingReadiness.ExternalSubmerchantNotOperational(merchantAcquirer.ExternalSubmerchantStatus);

        return SubmerchantRoutingReadiness.Ready(merchantAcquirer.ExternalSubmerchantStatus);
    }
}