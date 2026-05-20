using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;

namespace safefy_api_core.Services.Queues;

public sealed class LogBackgroundService(
    IServiceScopeFactory serviceScopeFactory,
    ILogger<LogBackgroundService> logger,
    ILogQueue<SecurityLogEntry>? securityLogQueue = null,
    ILogQueue<ApiLogEntry>? apiLogQueue = null,
    ILogQueue<EmailLogEntry>? emailLogQueue = null,
    ILogQueue<AcquirerWebhookLogEntry>? acquirerWebhookLogQueue = null
) : BackgroundService
{
    private const int BatchSize = 100;
    private const int FlushIntervalMs = 1000;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("LogBackgroundService started");

        var tasks = new List<Task>();

        if (securityLogQueue != null)
        {
            tasks.Add(ProcessQueueAsync(
                securityLogQueue,
                async (dbContext, logs) =>
                {
                    dbContext.SecurityLogs.AddRange(logs);
                    await dbContext.SaveChangesAsync(stoppingToken);
                },
                "SecurityLogs",
                stoppingToken
            ));
        }

        if (apiLogQueue != null)
        {
            tasks.Add(ProcessQueueAsync(
                apiLogQueue,
                async (dbContext, logs) =>
                {
                    dbContext.ApiLogs.AddRange(logs);
                    await dbContext.SaveChangesAsync(stoppingToken);
                },
                "ApiLogs",
                stoppingToken
            ));
        }

        if (emailLogQueue != null)
        {
            tasks.Add(ProcessQueueAsync(
                emailLogQueue,
                async (dbContext, logs) =>
                {
                    dbContext.EmailLogs.AddRange(logs);
                    await dbContext.SaveChangesAsync(stoppingToken);
                },
                "EmailLogs",
                stoppingToken
            ));
        }

        if (acquirerWebhookLogQueue != null)
        {
            tasks.Add(ProcessQueueAsync(
                acquirerWebhookLogQueue,
                async (dbContext, logs) =>
                {
                    dbContext.AcquirerWebhookLogs.AddRange(logs);
                    await dbContext.SaveChangesAsync(stoppingToken);
                },
                "AcquirerWebhookLogs",
                stoppingToken
            ));
        }

        if (tasks.Count > 0)
        {
            await Task.WhenAll(tasks);
        }

        logger.LogInformation("LogBackgroundService stopped");
    }

    private async Task ProcessQueueAsync<T>(
        ILogQueue<T> queue,
        Func<LogDbContext, List<T>, Task> persistAction,
        string queueName,
        CancellationToken stoppingToken) where T : class
    {
        var batch = new List<T>(BatchSize);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var timeoutCts = new CancellationTokenSource(FlushIntervalMs);
                using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken, timeoutCts.Token);

                try
                {
                    await foreach (var item in queue.DequeueAllAsync(linkedCts.Token))
                    {
                        batch.Add(item);

                        if (batch.Count >= BatchSize)
                        {
                            await FlushBatchAsync(batch, persistAction, queueName, stoppingToken);
                        }
                    }
                }
                catch (OperationCanceledException) when (timeoutCts.IsCancellationRequested)
                {
                    // Timeout reached, flush whatever we have
                }

                if (batch.Count > 0)
                {
                    await FlushBatchAsync(batch, persistAction, queueName, stoppingToken);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error processing {QueueName} queue", queueName);
                await Task.Delay(1000, stoppingToken);
            }
        }

        // Graceful shutdown: flush remaining items
        if (batch.Count > 0)
        {
            try
            {
                await FlushBatchAsync(batch, persistAction, queueName, CancellationToken.None);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error flushing remaining {QueueName} on shutdown. Lost {Count} logs",
                    queueName, batch.Count);
            }
        }
    }

    private async Task FlushBatchAsync<T>(
        List<T> batch,
        Func<LogDbContext, List<T>, Task> persistAction,
        string queueName,
        CancellationToken cancellationToken) where T : class
    {
        if (batch.Count == 0)
            return;

        try
        {
            using var scope = serviceScopeFactory.CreateScope();
            var dbContextFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<LogDbContext>>();
            await using var dbContext = await dbContextFactory.CreateDbContextAsync(cancellationToken);

            await persistAction(dbContext, batch);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to persist {Count} {QueueName} entries", batch.Count, queueName);
        }
        finally
        {
            batch.Clear();
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        logger.LogInformation("LogBackgroundService stopping. Queues: Security={SecurityCount}, Api={ApiCount}, Email={EmailCount}, AcquirerWebhook={AcquirerWebhookCount}",
            securityLogQueue?.Count ?? 0,
            apiLogQueue?.Count ?? 0,
            emailLogQueue?.Count ?? 0,
            acquirerWebhookLogQueue?.Count ?? 0);

        await base.StopAsync(cancellationToken);
    }
}
