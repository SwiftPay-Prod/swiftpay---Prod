using Microsoft.Extensions.DependencyInjection;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Services;

namespace swiftpay_api_core.Extensions;

/// <summary>
/// Extension methods para registro do IEnvironmentProvider.
/// </summary>
public static class EnvironmentProviderExtensions
{
    /// <summary>
    /// Registra o HybridEnvironmentProvider que suporta tanto requisições HTTP quanto
    /// background jobs e Consumers do MassTransit.
    /// 
    /// Para HTTP: Lê o ambiente do header X-Api-Environment
    /// Para Consumers/Jobs: Use HybridEnvironmentProvider.SetEnvironment(env) antes de criar o scope
    /// </summary>
    /// <remarks>
    /// IMPORTANTE: O header X-Api-Environment DEVE ser enviado em todas as requisições HTTP que
    /// dependem do ambiente (Sandbox/Production). Sem o header, o ambiente padrão será Production.
    /// 
    /// Uso em Consumers:
    /// <code>
    /// public class MyConsumer : IConsumer&lt;MyMessage&gt;
    /// {
    ///     public async Task Consume(ConsumeContext&lt;MyMessage&gt; context)
    ///     {
    ///         using (HybridEnvironmentProvider.SetEnvironment(context.Message.Environment))
    ///         {
    ///             using var scope = scopeFactory.CreateScope();
    ///             var dbContext = scope.ServiceProvider.GetRequiredService&lt;PrimaryDbContext&gt;();
    ///             // Código que usa DbContext - automaticamente filtrado pelo ambiente da mensagem
    ///         }
    ///     }
    /// }
    /// </code>
    /// </remarks>
    public static IServiceCollection AddEnvironmentProvider(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<IEnvironmentProvider, HybridEnvironmentProvider>();
        return services;
    }

    /// <summary>
    /// Registra ambos os providers (alias for AddEnvironmentProvider).
    /// </summary>
    [Obsolete("Use AddEnvironmentProvider instead")]
    public static IServiceCollection AddEnvironmentProviders(this IServiceCollection services)
    {
        return services.AddEnvironmentProvider();
    }

    /// <summary>
    /// [Obsolete] Use AddEnvironmentProvider instead.
    /// </summary>
    [Obsolete("Use AddEnvironmentProvider and HybridEnvironmentProvider.SetEnvironment() instead")]
    public static IServiceCollection AddAsyncLocalEnvironmentProvider(this IServiceCollection services)
    {
        return services.AddEnvironmentProvider();
    }
}
