using safefy_api_core.Models.Database;
using safefy_api_payment.Interfaces;

namespace safefy_api_payment.Services.Acquirers;

public sealed class AcquirerServiceFactory(IEnumerable<IAcquirerService> acquirerServices) : IAcquirerServiceFactory
{
    private readonly Dictionary<AcquirerType, IAcquirerService> _services = 
        acquirerServices.ToDictionary(s => s.AcquirerType);

    public IAcquirerService? GetService(AcquirerType acquirerType)
    {
        return _services.TryGetValue(acquirerType, out var service) ? service : null;
    }

    public bool IsSupported(AcquirerType acquirerType)
    {
        return _services.ContainsKey(acquirerType);
    }
}
