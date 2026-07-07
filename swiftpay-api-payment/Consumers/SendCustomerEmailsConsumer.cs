using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using swiftpay_api_core.Constants;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Models.MassTransit;
using swiftpay_api_core.Services;

namespace swiftpay_api_payment.Consumers;

public sealed class SendCustomerEmailsConsumer(
    IServiceScopeFactory scopeFactory,
    ILogger<SendCustomerEmailsConsumer> logger
) : IConsumer<SendCustomerEmailsMessage>
{
    public async Task Consume(ConsumeContext<SendCustomerEmailsMessage> context)
    {
        var message = context.Message;

        try
        {
            var environment = Enum.TryParse<ApiEnvironment>(message.Environment, out var env)
                ? env
                : ApiEnvironment.Production;
            using var environmentScope = HybridEnvironmentProvider.SetEnvironment(environment);

            using var scope = scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();
            var emailTemplateService = scope.ServiceProvider.GetRequiredService<IEmailTemplateService>();
            var messagePublisher = scope.ServiceProvider.GetRequiredService<IMessagePublisher>();

            var payment = await dbContext.Payments
                .Include(p => p.Merchant)
                .Include(p => p.Order)
                    .ThenInclude(o => o!.Items)
                .OrderBy(p => p.Id)
                .FirstOrDefaultAsync(p => p.Id == message.PaymentId, context.CancellationToken);

            if (payment == null)
            {
                logger.LogError("Payment not found for SendCustomerEmails: {PaymentId}", message.PaymentId);
                return;
            }

            var emailContext = new EmailTemplateContext
            {
                MerchantId = message.MerchantId,
                Environment = environment,
                CustomerEmail = message.CustomerEmail,
                CustomerName = message.CustomerName,
                OrderNumber = payment.Order?.OrderNumber ?? $"#{payment.Id.ToString()[..8]}",
                OrderDate = payment.CompletedAt ?? payment.CreatedAt,
                OrderTotal = payment.Amount,
                OrderSubtotal = payment.Order?.SubtotalAmount ?? payment.Amount,
                OrderShipping = payment.Order?.ShippingAmount ?? 0,
                OrderDiscount = payment.Order?.DiscountAmount ?? 0,
                PaymentMethod = payment.Method.ToString(),
                MerchantName = payment.Merchant?.Name,
                MerchantLogoUrl = null,
                OrderItems = payment.Order?.Items?.Select(i => new OrderItemInfo
                {
                    ProductName = i.ProductName,
                    VariantName = i.VariantName,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    TotalPrice = i.TotalPrice,
                    ImageUrl = i.ImageUrl
                }).ToList()
            };

            var isNewCustomer = await emailTemplateService.IsNewCustomerAsync(
                message.MerchantId,
                message.CustomerEmail,
                context.CancellationToken);

            if (isNewCustomer)
            {
                var welcomeResult = await emailTemplateService.SendAsync(
                    MerchantEmailTemplateType.Welcome,
                    emailContext,
                    context.CancellationToken);
                if (!welcomeResult.Success && !welcomeResult.TemplateDisabled)
                {
                    logger.LogError(
                        "Failed to send welcome email: PaymentId={PaymentId}, Error={Error}",
                        message.PaymentId,
                        welcomeResult.ErrorMessage);
                }
            }

            var confirmationResult = await emailTemplateService.SendAsync(
                MerchantEmailTemplateType.PaymentConfirmation,
                emailContext,
                context.CancellationToken);
            if (!confirmationResult.Success && !confirmationResult.TemplateDisabled)
            {
                logger.LogError(
                    "Failed to send payment confirmation email: PaymentId={PaymentId}, Error={Error}",
                    message.PaymentId,
                    confirmationResult.ErrorMessage);
            }

            if (message.OrderId.HasValue)
            {
                await messagePublisher.PublishAsync(
                    RabbitMQQueues.ProcessDigitalDelivery,
                    new ProcessDigitalDeliveryMessage
                    {
                        OrderId = message.OrderId.Value,
                        PaymentId = message.PaymentId,
                        MerchantId = message.MerchantId,
                        Environment = message.Environment,
                        CustomerId = message.CustomerId,
                        CustomerEmail = message.CustomerEmail,
                        CustomerName = message.CustomerName
                    });
            }
        }
        catch (Exception ex)
        {
            logger.LogError(
                ex,
                "Error processing customer emails for PaymentId={PaymentId}",
                message.PaymentId);
            throw;
        }
    }
}
