using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Services;

namespace swiftpay_api_core.Extensions;

public static class EmailIntentRelayServiceCollectionExtensions
{
    public static IServiceCollection AddEmailIntentRelay(this IServiceCollection services)
    {
        services.TryAddSingleton<TimeProvider>(TimeProvider.System);
        services.TryAddSingleton<IEmailTemplateRenderer, EmailTemplateRenderer>();
        services.AddScoped<IEmailMessageTemplateCatalog, EmailMessageTemplateCatalog>();
        services.AddSingleton<IPlatformAuthActionLinkGenerator, PlatformAuthActionLinkGenerator>();
        services.AddScoped<EmailIntentRelayProcessor>();
        services.AddSingleton<EmailIntentRelayHostedService>();
        services.AddSingleton<IEmailIntentRelaySignal>(provider =>
            provider.GetRequiredService<EmailIntentRelayHostedService>());
        services.AddHostedService(provider =>
            provider.GetRequiredService<EmailIntentRelayHostedService>());
        return services;
    }
}
