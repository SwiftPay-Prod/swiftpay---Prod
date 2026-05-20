using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using safefy_api_core.Models.Settings;

namespace safefy_api_core.Extensions;

public static class SettingsExtensions
{
    public static IServiceCollection AddCoreSettings(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<DatabaseSettingsOptions>(
            configuration.GetSection(DatabaseSettingsOptions.DatabaseSettings));

        services.Configure<LogsDatabaseSettingsOptions>(
            configuration.GetSection(LogsDatabaseSettingsOptions.LogsDatabaseSettings));

        services.Configure<EmailSettingsOptions>(
            configuration.GetSection(EmailSettingsOptions.EmailSettings));

        services.Configure<RabbitMQSettings>(
            configuration.GetSection(RabbitMQSettings.RabbitMQ));

        services.Configure<JWTSettingsOptions>(
            configuration.GetSection(JWTSettingsOptions.JWTSettings));

        services.Configure<PlatformSettingsOptions>(
            configuration.GetSection(PlatformSettingsOptions.PlatformSettings));

        services.Configure<FirebaseSettings>(
            configuration.GetSection(FirebaseSettings.SectionName));

        services.Configure<ValkeySettings>(
            configuration.GetSection(ValkeySettings.SectionName));

        return services;
    }

    public static IServiceCollection AddDatabaseSettings(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<DatabaseSettingsOptions>(
            configuration.GetSection(DatabaseSettingsOptions.DatabaseSettings));

        return services;
    }

    public static IServiceCollection AddLogsDatabaseSettings(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<LogsDatabaseSettingsOptions>(
            configuration.GetSection(LogsDatabaseSettingsOptions.LogsDatabaseSettings));

        return services;
    }

    public static IServiceCollection AddEmailSettings(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<EmailSettingsOptions>(
            configuration.GetSection(EmailSettingsOptions.EmailSettings));

        return services;
    }

    public static IServiceCollection AddRabbitMQSettings(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<RabbitMQSettings>(
            configuration.GetSection(RabbitMQSettings.RabbitMQ));

        return services;
    }

    public static IServiceCollection AddJWTSettings(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<JWTSettingsOptions>(
            configuration.GetSection(JWTSettingsOptions.JWTSettings));

        return services;
    }

    public static IServiceCollection AddPlatformSettings(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<PlatformSettingsOptions>(
            configuration.GetSection(PlatformSettingsOptions.PlatformSettings));

        return services;
    }

    public static IServiceCollection AddFirebaseSettings(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<FirebaseSettings>(
            configuration.GetSection(FirebaseSettings.SectionName));

        return services;
    }
}
