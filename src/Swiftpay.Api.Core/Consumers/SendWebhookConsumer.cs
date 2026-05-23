using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Swiftpay.Api.Core.Messages;
using Swiftpay.Api.Core.Services;
using Swiftpay.Domain.Entities;
using Swiftpay.Infrastructure.Data;

namespace Swiftpay.Api.Core.Consumers;

public class SendWebhookConsumer : IConsumer<SendWebhookMessage>
{
    private readonly AppDbContext _db;
    private readonly WebhookService _webhook;
    private readonly ILogger<SendWebhookConsumer> _logger;

    public SendWebhookConsumer(AppDbContext db, WebhookService webhook, ILogger<SendWebhookConsumer> logger)
    {
        _db = db;
        _webhook = webhook;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<SendWebhookMessage> context)
    {
        var configs = await _db.Set<WebhookConfiguration>()
            .Where(w => w.IsActive)
            .ToListAsync(context.CancellationToken);

        foreach (var config in configs)
        {
            var success = await _webhook.SendAsync(config, context.Message.EventType,
                new { paymentId = context.Message.PaymentId, eventType = context.Message.EventType },
                context.CancellationToken);
            _logger.LogInformation("Webhook {R} for {P} to {U}", success ? "sent" : "failed", context.Message.PaymentId, config.Url);
        }
    }
}
