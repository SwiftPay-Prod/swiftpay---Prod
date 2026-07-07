namespace swiftpay_api_core.Interfaces;

public interface ILogQueue<T> where T : class
{
    ValueTask EnqueueAsync(T item, CancellationToken cancellationToken = default);
    IAsyncEnumerable<T> DequeueAllAsync(CancellationToken cancellationToken);
    int Count { get; }
}
