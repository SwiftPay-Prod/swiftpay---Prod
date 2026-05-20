using MassTransit;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Settings;

namespace safefy_api_core.Services;

public sealed class MassTransitMessagePublisher(
    IPublishEndpoint publishEndpoint,
    IOptions<RabbitMQSettings> settings,
    ILogger<MassTransitMessagePublisher> logger
) : IMessagePublisher
{
    private readonly RabbitMQSettings _settings = settings.Value;

    public bool IsEnabled => _settings.Enabled;

    public async Task PublishAsync<T>(string queueName, T message, CancellationToken ct = default) where T : class
    {
        if (!_settings.Enabled)
        {
            return;
        }

        try
        {
            await publishEndpoint.Publish(message, ctx =>
            {
                ctx.SetRoutingKey(queueName);
            }, ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to publish message to queue {Queue}", queueName);
            throw;
        }
    }
}

public sealed class DisabledMessagePublisher : IMessagePublisher
{
    public bool IsEnabled => false;

    public Task PublishAsync<T>(string queueName, T message, CancellationToken ct = default) where T : class
    {
        return Task.CompletedTask;
    }
}
