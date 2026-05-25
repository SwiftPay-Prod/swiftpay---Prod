using MassTransit;
using Swiftpay.Api.Core.Messages;
using Swiftpay.Api.Core.Services;

namespace Swiftpay.Api.Core.Consumers;

public class SendCustomerEmailsConsumer : IConsumer<PaymentCompletedMessage>
{
    private readonly IEmailService _email;

    public SendCustomerEmailsConsumer(IEmailService email)
    {
        _email = email;
    }

    public async Task Consume(ConsumeContext<PaymentCompletedMessage> context)
    {
        if (context.Message.NewStatus != "PAID")
            return;

        await _email.SendPaymentReceivedAsync(
            "merchant@email.com",
            "Merchant",
            context.Message.Amount,
            context.Message.PaymentId.ToString(),
            context.CancellationToken);
    }
}
