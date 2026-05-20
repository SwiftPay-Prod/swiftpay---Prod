using System.Threading.Channels;
using safefy_api_core.Interfaces;

namespace safefy_api_core.Services.Queues;

public sealed class LogQueue<T> : ILogQueue<T> where T : class
{
    private readonly Channel<T> _channel;

    public LogQueue(int capacity = 10_000)
    {
        var options = new BoundedChannelOptions(capacity)
        {
            FullMode = BoundedChannelFullMode.DropOldest,
            SingleReader = true,
            SingleWriter = false
        };

        _channel = Channel.CreateBounded<T>(options);
    }

    public int Count => _channel.Reader.Count;

    public ValueTask EnqueueAsync(T item, CancellationToken cancellationToken = default)
    {
        return _channel.Writer.WriteAsync(item, cancellationToken);
    }

    public async IAsyncEnumerable<T> DequeueAllAsync(
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken)
    {
        await foreach (var item in _channel.Reader.ReadAllAsync(cancellationToken))
        {
            yield return item;
        }
    }
}
