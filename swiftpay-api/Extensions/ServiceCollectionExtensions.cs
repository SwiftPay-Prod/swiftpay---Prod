using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Options;
using swiftpay_api.Interfaces;
using swiftpay_api.Models.Settings;
using swiftpay_api.Providers;
using swiftpay_api.Services.Internal;
using swiftpay_api_core.Extensions;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Services;

namespace swiftpay_api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddCoreServices(this IServiceCollection services)
    {
        // Environment Provider - IMPORTANTE: Deve ser registrado antes de outros serviços
        // O header X-Api-Environment DEVE ser enviado em todas as requisições
        // Para consumers, use HybridEnvironmentProvider.SetEnvironment(env) antes de criar o scope
        services.AddEnvironmentProvider();

        services.AddLogServices();
        services.AddGeoLocationService();
        services.AddNotificationService();
        services.AddEmailService();
        services.AddLedgerRepository();
        services.AddLedgerService();
        services.AddPushNotificationService();
        services.AddBankReconciliationService();
        services.AddEmailBlockRenderer();
        services.AddAchievementService();
        services.AddCalculationService();
        services.AddMerchantCalculationService();
        services.AddScoped<IReferralCommissionCompilationService, ReferralCommissionCompilationService>();
        services.AddScoped<IWayneProtocolService, WayneProtocolService>();

        services.AddScoped<IEmailTemplateProvider, EmailTemplateProvider>();

        return services;
    }

    public static IServiceCollection AddInternalServices(this IServiceCollection services)
    {
        services.AddSwiftPayDataProtection();

        services.AddHostedService<StartupWarmupService>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<ISessionService, SessionService>();
        services.AddScoped<IFirebaseAuthService, FirebaseAuthService>();
        services.AddScoped<IStorageService, StorageService>();
        services.AddScoped<INotificationHubService, NotificationHubService>();
        services.AddScoped<IDashboardHubService, DashboardHubService>();
        services.AddScoped<ReferralCommissionCalculator>();
        services.AddScoped<IAutomaticCashoutService, AutomaticCashoutService>();
        services.AddScoped<IRankingSchedulerService, RankingSchedulerService>();
        services.AddScoped<IRankingProcessingStatusService, RankingProcessingStatusService>();
        services.AddScoped<ISubmerchantProvisioningService, SubmerchantProvisioningService>();

        return services;
    }

    public static IServiceCollection AddSignalRHubs(this IServiceCollection services)
    {
        services.AddSignalR(hubOptions =>
        {
            hubOptions.MaximumReceiveMessageSize = 32768;
        });
        services.AddSingleton<IUserIdProvider, UserIdProvider>();

        return services;
    }

    public static IServiceCollection AddPaymentApiClient(this IServiceCollection services)
    {
        services.AddHttpClient<IPaymentApiClient, PaymentApiClient>((sp, client) =>
        {
            var settings = sp.GetRequiredService<IOptions<PaymentApiSettings>>().Value;

            client.BaseAddress = new Uri(settings.BaseUrl);
            client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
            client.DefaultRequestHeaders.Add("X-Internal-Api-Key", settings.InternalApiKey);
        });

        return services;
    }
}
