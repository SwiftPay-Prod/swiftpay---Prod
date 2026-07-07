using swiftpay_api_core.Consumers;
using swiftpay_api_core.Constants;
using swiftpay_api_core.Extensions;

namespace swiftpay_api.Extensions;

public static class MassTransitExtensions
{
    public static IServiceCollection AddMassTransitWithConsumers(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        return services.AddMassTransitRabbitMQ(configuration, x =>
        {
            x.AddConsumer<NotificationCreatedConsumer>();
            x.AddConsumer<ProcessMerchantDashboardConsumer>();
            x.AddConsumer<ProcessAdminDashboardConsumer>();
            x.AddConsumer<ProcessAcquirerDashboardConsumer>();
            x.AddConsumer<ProcessPlatformBalanceConsumer>();
            x.AddConsumer<SendPushNotificationConsumer>();
            x.AddConsumer<CreateBulkUserNotificationConsumer>();
            x.AddConsumer<ProcessBankReconciliationConsumer>();
            x.AddConsumer<StartAllReconciliationsConsumer>();
            x.AddConsumer<ReconcilePlatformBalanceConsumer>();
            x.AddConsumer<ProcessRankingConsumer>();
            x.AddConsumer<ProcessReferralRankingConsumer>();
            x.AddConsumer<ProcessAcquirerRankingConsumer>();
            x.AddConsumer<ProcessReferralHistoricalCommissionConsumer>();
        });
    }
}
