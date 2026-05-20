using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_payment.Interfaces.Transactions;

namespace safefy_api_payment.Services.Transactions;

public interface IPaymentMethodServiceFactory
{
    IPaymentMethodService? GetService(PaymentMethod method);
    IEnumerable<PaymentMethod> GetAvailableMethods();
}

public class PaymentMethodServiceFactory(IEnumerable<IPaymentMethodService> services) : IPaymentMethodServiceFactory
{
    private readonly Dictionary<PaymentMethod, IPaymentMethodService> _services = 
        services.ToDictionary(s => s.Method);

    /// <inheritdoc/>
    public IPaymentMethodService? GetService(PaymentMethod method)
    {
        return _services.TryGetValue(method, out var service) ? service : null;
    }

    /// <inheritdoc/>
    public IEnumerable<PaymentMethod> GetAvailableMethods()
    {
        return _services.Values.Select(s => s.Method);
    }
}
