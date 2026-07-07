using swiftpay_api_core.Models.Database;
using swiftpay_api_payment.Interfaces.Internal;

namespace swiftpay_api_payment.Interfaces.Internal.Submerchants;

public interface ISubmerchantProviderAdapterFactory
{
    ISubmerchantProviderAdapter? GetAdapter(AcquirerType acquirerType);

    ISubmerchantProviderAdapter? GetAdapter(AcquirerConfigResult acquirerConfig);

    SubmerchantProviderOperations GetOperations(AcquirerType acquirerType);

    SubmerchantProviderOperations GetOperations(AcquirerConfigResult acquirerConfig);

    bool IsSupported(AcquirerType acquirerType);

    bool IsSupported(AcquirerConfigResult acquirerConfig);
}