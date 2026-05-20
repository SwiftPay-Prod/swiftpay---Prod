using safefy_api_core.Extensions;
using safefy_api_payment.Consumers;

namespace safefy_api_payment.Extensions;

public static class MassTransitExtensions
{
    public static IServiceCollection AddMassTransitWithConsumers(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        return services.AddMassTransitRabbitMQ(configuration, x =>
        {
            x.AddConsumer<RecordLedgerPendingConsumer>();
            x.AddConsumer<PaymentCompletedConsumer>();
            x.AddConsumer<ProcessCashoutConsumer>();
            x.AddConsumer<SendWebhookConsumer>();
            x.AddConsumer<SendCashoutWebhookConsumer>();
            x.AddConsumer<ProcessDigitalDeliveryConsumer>();
            x.AddConsumer<SendCustomerEmailsConsumer>();
            x.AddConsumer<ProcessPlatformPayoutConsumer>();
            x.AddConsumer<ProcessPlatformPayoutItemConsumer>();
        });
    }
}
