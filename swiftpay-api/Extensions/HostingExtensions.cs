using Microsoft.Extensions.Configuration.Json;
using Microsoft.Extensions.Hosting;

namespace swiftpay_api.Extensions;

public static class HostingExtensions
{
    public static WebApplicationBuilder AddProductionStartupSafeguards(this WebApplicationBuilder builder)
    {
        if (!builder.Environment.IsProduction())
        {
            return builder;
        }

        builder.Services.Configure<HostOptions>(options =>
        {
            options.BackgroundServiceExceptionBehavior = BackgroundServiceExceptionBehavior.Ignore;
        });

        foreach (var source in builder.Configuration.Sources.OfType<JsonConfigurationSource>())
        {
            source.ReloadOnChange = false;
        }

        return builder;
    }
}
