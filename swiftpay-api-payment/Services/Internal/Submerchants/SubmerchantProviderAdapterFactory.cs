using safefy_api_core.Models.Database;
using safefy_api_payment.Interfaces.Internal;
using safefy_api_payment.Interfaces.Internal.Submerchants;

namespace safefy_api_payment.Services.Internal.Submerchants;

public sealed class SubmerchantProviderAdapterFactory(
    IEnumerable<ISubmerchantProviderAdapter> adapters
) : ISubmerchantProviderAdapterFactory
{
    private readonly IReadOnlyList<ISubmerchantProviderAdapter> _adapters = adapters.ToList();

    private readonly IReadOnlyDictionary<AcquirerType, ISubmerchantProviderAdapter> _adaptersByType =
        adapters.ToDictionary(a => a.AcquirerType);

    public ISubmerchantProviderAdapter? GetAdapter(AcquirerType acquirerType)
        => _adaptersByType.TryGetValue(acquirerType, out var adapter) ? adapter : null;

    public ISubmerchantProviderAdapter? GetAdapter(AcquirerConfigResult acquirerConfig)
    {
        if (_adaptersByType.TryGetValue(acquirerConfig.AcquirerType, out var directAdapter)
            && directAdapter.Supports(acquirerConfig))
        {
            return directAdapter;
        }

        return _adapters.FirstOrDefault(adapter => adapter.Supports(acquirerConfig));
    }

    public SubmerchantProviderOperations GetOperations(AcquirerType acquirerType)
        => GetAdapter(acquirerType)?.Operations ?? SubmerchantProviderOperations.None();

    public SubmerchantProviderOperations GetOperations(AcquirerConfigResult acquirerConfig)
        => GetAdapter(acquirerConfig)?.Operations ?? SubmerchantProviderOperations.None();

    public bool IsSupported(AcquirerType acquirerType)
        => _adaptersByType.ContainsKey(acquirerType);

    public bool IsSupported(AcquirerConfigResult acquirerConfig)
        => GetAdapter(acquirerConfig) is not null;
}