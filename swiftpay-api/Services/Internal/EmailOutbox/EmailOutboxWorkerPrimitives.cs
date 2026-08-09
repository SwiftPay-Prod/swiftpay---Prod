using System.Security.Cryptography;
using System.Threading.Channels;
using Microsoft.Extensions.Options;
using swiftpay_api_core.Models.Settings;

namespace swiftpay_api.Services.Internal.EmailOutbox;

public interface IEmailOutboxWorkQueue
{
    ValueTask EnqueueAsync(Guid intentId, CancellationToken cancellationToken = default);
    IAsyncEnumerable<Guid> ReadAllAsync(CancellationToken cancellationToken = default);
}

public sealed class EmailOutboxWorkQueue : IEmailOutboxWorkQueue
{
    private readonly Channel<Guid> _channel = Channel.CreateBounded<Guid>(new BoundedChannelOptions(256)
    {
        FullMode = BoundedChannelFullMode.DropWrite,
        SingleReader = true,
        SingleWriter = false
    });

    public ValueTask EnqueueAsync(Guid intentId, CancellationToken cancellationToken = default) =>
        _channel.Writer.WriteAsync(intentId, cancellationToken);

    public IAsyncEnumerable<Guid> ReadAllAsync(CancellationToken cancellationToken = default) =>
        _channel.Reader.ReadAllAsync(cancellationToken);
}

public interface IEmailRetryBackoff
{
    TimeSpan GetDelay(Guid intentId, int failureCount);
}

public sealed class DeterministicEmailRetryBackoff(IOptions<EmailPlatformSettings> settings) : IEmailRetryBackoff
{
    private readonly EmailPlatformSettings _settings = settings.Value;

    public TimeSpan GetDelay(Guid intentId, int failureCount)
    {
        var exponent = Math.Clamp(failureCount - 1, 0, 30);
        var unjittered = Math.Min(
            _settings.RetryMaximumSeconds,
            _settings.RetryBaseSeconds * Math.Pow(2, exponent));
        Span<byte> input = stackalloc byte[20];
        intentId.TryWriteBytes(input);
        BitConverter.TryWriteBytes(input[16..], failureCount);
        Span<byte> hash = stackalloc byte[32];
        SHA256.HashData(input, hash);
        var unit = BitConverter.ToUInt32(hash) / (double)uint.MaxValue;
        var jitter = .8 + unit * .4;
        return TimeSpan.FromSeconds(unjittered * jitter);
    }
}
