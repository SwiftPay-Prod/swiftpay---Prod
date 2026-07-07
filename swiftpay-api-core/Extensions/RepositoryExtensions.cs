using Microsoft.Extensions.DependencyInjection;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Repositories;

namespace swiftpay_api_core.Extensions;

public static class RepositoryExtensions
{
    public static IServiceCollection AddLedgerRepository(this IServiceCollection services)
    {
        return services.AddScoped<ILedgerRepository>(sp => 
            new LedgerRepository(sp.GetRequiredService<PrimaryDbContext>()));
    }

    public static IServiceCollection AddNotificationRepository(this IServiceCollection services)
    {
        return services.AddScoped<INotificationRepository>(sp => 
            new NotificationRepository(sp.GetRequiredService<PrimaryDbContext>()));
    }
}
