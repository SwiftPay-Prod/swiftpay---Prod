namespace Swiftpay.Api.Core.Providers;

public class PixProviderFactory
{
    private readonly Dictionary<string, IPixProvider> _providers;

    public PixProviderFactory(IEnumerable<IPixProvider> providers)
    {
        _providers = providers.ToDictionary(p => p.ProviderName);
    }

    public IPixProvider GetProvider(string name) =>
        _providers.TryGetValue(name, out var provider) ? provider
        : throw new KeyNotFoundException($"Provider '{name}' not found");
}
