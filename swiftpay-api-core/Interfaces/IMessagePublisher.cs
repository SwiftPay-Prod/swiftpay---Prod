namespace swiftpay_api_core.Interfaces;

public interface IMessagePublisher
{
    Task PublishAsync<T>(string queueName, T message, CancellationToken ct = default) where T : class;
    bool IsEnabled { get; }
}
