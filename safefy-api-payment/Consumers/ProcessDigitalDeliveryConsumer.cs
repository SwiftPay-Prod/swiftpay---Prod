using MassTransit;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Enum;
using safefy_api_core.Models.MassTransit;
using safefy_api_core.Services;

namespace safefy_api_payment.Consumers;

/// <summary>
/// Consumer that processes digital item delivery after payment completion.
/// </summary>
public sealed class ProcessDigitalDeliveryConsumer(
    IServiceScopeFactory scopeFactory,
    ILogger<ProcessDigitalDeliveryConsumer> logger
) : IConsumer<ProcessDigitalDeliveryMessage>
{
    public async Task Consume(ConsumeContext<ProcessDigitalDeliveryMessage> context)
    {
        var message = context.Message;

        try
        {
            // Define o environment ANTES de criar o scope para que o DbContext use o QueryFilter correto
            var environment = Enum.TryParse<ApiEnvironment>(message.Environment, out var env) 
                ? env 
                : ApiEnvironment.Production;
            using var environmentScope = HybridEnvironmentProvider.SetEnvironment(environment);
            
            // Resolver o service DENTRO do scope para usar o environment correto
            using var scope = scopeFactory.CreateScope();
            var digitalDeliveryService = scope.ServiceProvider.GetRequiredService<IDigitalDeliveryService>();
            
            var result = await digitalDeliveryService.ProcessDeliveryAsync(
                message.PaymentId,
                message.MerchantId,
                message.OrderId,
                message.CustomerEmail,
                message.CustomerName,
                message.Environment,
                context.CancellationToken);

            if (!result.Success)
            {
                logger.LogError(
                    "Digital delivery failed for PaymentId={PaymentId}: {Error}",
                    message.PaymentId,
                    result.ErrorMessage);
            }
            else if (result.ItemsDelivered > 0)
            {
                if (result.ProductsWithNoStock.Count > 0)
                {
                    logger.LogError(
                        "Digital delivery partially completed for PaymentId={PaymentId}. Products with no stock: {Products}",
                        message.PaymentId,
                        string.Join(", ", result.ProductsWithNoStock));
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(
                ex,
                "Error processing digital delivery for PaymentId={PaymentId}",
                message.PaymentId);

            throw;
        }
    }
}
