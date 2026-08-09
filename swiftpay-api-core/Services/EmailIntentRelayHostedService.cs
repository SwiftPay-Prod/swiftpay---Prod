using System.Threading.Channels;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Settings;

namespace swiftpay_api_core.Services;

public sealed class EmailIntentRelayHostedService(
    IServiceScopeFactory scopeFactory,
    IOptions<EmailPlatformSettings> settings,
    ILogger<EmailIntentRelayHostedService> logger)
    : BackgroundService, IEmailIntentRelaySignal
{
    private const int MaximumConsecutiveBatches = 4;
    private readonly EmailPlatformSettings _settings = settings.Value;
    private readonly Channel<bool> _signals = Channel.CreateBounded<bool>(
        new BoundedChannelOptions(1)
        {
            SingleReader = true,
            SingleWriter = false,
            FullMode = BoundedChannelFullMode.DropWrite
        });

    public void Signal() => _signals.Writer.TryWrite(true);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        Signal();
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                if (_settings.Enabled)
                    await DrainBoundedAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Email intent relay batch failed");
            }

            await WaitForSignalOrRecoveryAsync(stoppingToken);
        }
    }

    private async Task DrainBoundedAsync(CancellationToken cancellationToken)
    {
        for (var batch = 0; batch < MaximumConsecutiveBatches; batch++)
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var processor = scope.ServiceProvider.GetRequiredService<EmailIntentRelayProcessor>();
            var result = await processor.ProcessBatchAsync(cancellationToken);
            if (!result.MayHaveMore(_settings.RelayBatchSize))
                return;
        }

        Signal();
    }

    private async Task WaitForSignalOrRecoveryAsync(CancellationToken cancellationToken)
    {
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeout.CancelAfter(TimeSpan.FromSeconds(Math.Max(1, _settings.RelayPollingIntervalSeconds)));
        try
        {
            await _signals.Reader.ReadAsync(timeout.Token);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            // Periodic recovery wake-up.
        }
    }
}
