namespace Swiftpay.Api.Core.Providers;

public class PixProviderFactory
{
    private readonly Dictionary<string, IPaymentProvider> _providers;

    public PixProviderFactory(IEnumerable<IPaymentProvider> providers)
    {
        _providers = providers.ToDictionary(p => p.ProviderName);
    }

    public IPaymentProvider GetProvider(string name) =>
        _providers.TryGetValue(name, out var provider) ? provider
        : throw new KeyNotFoundException($"Provider '{name}' not found");
}
