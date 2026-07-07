using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Resend;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Settings;
using swiftpay_api_core.Services;
using swiftpay_api_core.Services.Queues;

namespace swiftpay_api_core.Extensions;

public static class ServicesExtensions
{
    public static IServiceCollection AddLogServices(this IServiceCollection services)
    {
        services.AddSingleton<ILogQueue<SecurityLogEntry>, LogQueue<SecurityLogEntry>>();
        services.AddSingleton<ILogQueue<ApiLogEntry>, LogQueue<ApiLogEntry>>();
        services.AddSingleton<ILogQueue<EmailLogEntry>, LogQueue<EmailLogEntry>>();
        services.AddSingleton<ILogQueue<AcquirerWebhookLogEntry>, LogQueue<AcquirerWebhookLogEntry>>();

        services.AddHostedService<LogBackgroundService>();

        services.AddScoped<ISecurityLogService, SecurityLogDbService>();
        services.AddScoped<IApiLogService, ApiLogService>();
        services.AddScoped<IEmailLogService, EmailLogService>();
        services.AddScoped<IAcquirerWebhookLogService, AcquirerWebhookLogService>();
        
        return services;
    }

    public static IServiceCollection AddSecurityLogService(this IServiceCollection services)
    {
        services.AddSingleton<ILogQueue<SecurityLogEntry>, LogQueue<SecurityLogEntry>>();
        services.AddHostedService<LogBackgroundService>();
        services.AddScoped<ISecurityLogService, SecurityLogDbService>();
        return services;
    }

    public static IServiceCollection AddApiLogService(this IServiceCollection services)
    {
        services.AddSingleton<ILogQueue<ApiLogEntry>, LogQueue<ApiLogEntry>>();
        services.AddHostedService<LogBackgroundService>();
        services.AddScoped<IApiLogService, ApiLogService>();
        return services;
    }

    public static IServiceCollection AddGeoLocationService(this IServiceCollection services)
    {
        services.AddScoped<IGeoLocationService, GeoLocationService>();
        return services;
    }

    public static IServiceCollection AddEmailService(this IServiceCollection services)
    {
        services.AddOptions();
        
        services.AddOptions<ResendClientOptions>()
            .Configure<IOptions<EmailSettingsOptions>>((resendOptions, emailSettings) =>
            {
                if (emailSettings.Value?.Resend?.ApiKey != null)
                {
                    resendOptions.ApiToken = emailSettings.Value.Resend.ApiKey;
                }
            });

        services.AddHttpClient<IResend, ResendClient>();
        services.AddScoped<IEmailService, EmailService>();
        return services;
    }

    public static IServiceCollection AddLedgerService(this IServiceCollection services)
    {
        services.AddScoped<ILedgerService, LedgerService>();
        return services;
    }

    public static IServiceCollection AddNotificationService(this IServiceCollection services)
    {
        services.AddScoped<INotificationService, NotificationService>();
        return services;
    }

    public static IServiceCollection AddPushNotificationService(this IServiceCollection services)
    {
        services.AddHttpClient<IPushNotificationService, PushNotificationService>();
        return services;
    }

    public static IServiceCollection AddBankReconciliationService(this IServiceCollection services)
    {
        services.AddScoped<IBankReconciliationService, BankReconciliationService>();
        return services;
    }

    public static IServiceCollection AddEmailBlockRenderer(this IServiceCollection services)
    {
        services.AddScoped<IEmailBlockRenderer, EmailBlockRenderer>();
        return services;
    }

    public static IServiceCollection AddEmailTemplateService(this IServiceCollection services)
    {
        services.AddScoped<IEmailBlockRenderer, EmailBlockRenderer>();
        services.AddScoped<IEmailTemplateService, EmailTemplateService>();
        return services;
    }

    public static IServiceCollection AddAchievementService(this IServiceCollection services)
    {
        services.AddScoped<IAchievementService, AchievementService>();
        return services;
    }

    public static IServiceCollection AddCalculationService(this IServiceCollection services)
    {
        services.AddScoped<ICalculationService, CalculationService>();
        return services;
    }

    public static IServiceCollection AddMerchantCalculationService(this IServiceCollection services)
    {
        services.AddScoped<IMerchantCalculationService, MerchantCalculationService>();
        return services;
    }
}
