using MassTransit;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Settings;
using safefy_api_core.Services;

namespace safefy_api_core.Extensions;

public static class MassTransitExtensions
{
    public static IServiceCollection AddMassTransitRabbitMQ(
        this IServiceCollection services,
        IConfiguration configuration,
        Action<IBusRegistrationConfigurator>? configureConsumers = null)
    {
        services.Configure<RabbitMQSettings>(configuration.GetSection(RabbitMQSettings.RabbitMQ));

        var settings = configuration.GetSection(RabbitMQSettings.RabbitMQ).Get<RabbitMQSettings>()
            ?? new RabbitMQSettings();

        if (!settings.Enabled)
        {
            services.AddSingleton<IMessagePublisher, DisabledMessagePublisher>();
            return services;
        }

        services.AddMassTransit(x =>
        {
            configureConsumers?.Invoke(x);

            x.UsingRabbitMq((context, cfg) =>
            {
                var rabbitSettings = context.GetRequiredService<IOptions<RabbitMQSettings>>().Value;

                cfg.Host(rabbitSettings.HostName, (ushort)rabbitSettings.Port, rabbitSettings.VirtualHost, h =>
                {
                    h.Username(rabbitSettings.UserName);
                    h.Password(rabbitSettings.Password);
                });

                cfg.ConfigureEndpoints(context);
            });
        });

        services.AddScoped<IMessagePublisher, MassTransitMessagePublisher>();

        return services;
    }
}
