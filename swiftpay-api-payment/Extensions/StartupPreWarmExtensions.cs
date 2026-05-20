using Npgsql;
using System.Diagnostics;

namespace safefy_api_payment.Extensions;

public static class StartupPreWarmExtensions
{
    public static async Task PreWarmDatabasePoolsAsync(this WebApplication app, IConfiguration configuration)
    {
        var startedAtUtc = DateTimeOffset.UtcNow;
        var stopwatch = Stopwatch.StartNew();

        var primaryResult = await PreWarmPoolAsync("PrimaryDb", configuration["DatabaseSettings:ConnectionString"], app.Logger);
        var logsResult = await PreWarmPoolAsync("LogsDb", configuration["LogsDatabaseSettings:ConnectionString"], app.Logger);

        stopwatch.Stop();

        app.Logger.LogInformation(
            "Startup database pre-warm finished at {CompletedAtUtc}. DurationMs={DurationMs}. StartedAtUtc={StartedAtUtc}. PoolsWarmed={PoolsWarmed}/2. PoolSummary={PoolSummary}",
            DateTimeOffset.UtcNow,
            stopwatch.ElapsedMilliseconds,
            startedAtUtc,
            (primaryResult.WasWarmed ? 1 : 0) + (logsResult.WasWarmed ? 1 : 0),
            $"{primaryResult.PoolName}:{primaryResult.ConnectionsWarmed}; {logsResult.PoolName}:{logsResult.ConnectionsWarmed}");
    }

    private static async Task<PreWarmPoolResult> PreWarmPoolAsync(string poolName, string? connectionString, ILogger logger)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            logger.LogInformation(
                "Startup database pre-warm skipped for {PoolName} because connection string is not configured.",
                poolName);

            return new PreWarmPoolResult(poolName, false, 0);
        }

        var builder = new NpgsqlConnectionStringBuilder(connectionString);

        try
        {
            var minimumPoolSize = builder.MinPoolSize;
            var targetConnections = minimumPoolSize > 0 ? minimumPoolSize : 1;
            var poolStopwatch = Stopwatch.StartNew();

            if (targetConnections == 1)
            {
                await using var singleConnection = new NpgsqlConnection(connectionString);
                await singleConnection.OpenAsync();
                await singleConnection.CloseAsync();

                poolStopwatch.Stop();

                logger.LogInformation(
                    "Startup database pre-warm completed for {PoolName}. Host={Host}. Database={Database}. Pooling={Pooling}. MinPoolSize={MinPoolSize}. MaxPoolSize={MaxPoolSize}. ConnectionsWarmed={ConnectionsWarmed}. DurationMs={DurationMs}. CompletedAtUtc={CompletedAtUtc}.",
                    poolName,
                    builder.Host,
                    builder.Database,
                    builder.Pooling,
                    minimumPoolSize,
                    builder.MaxPoolSize,
                    1,
                    poolStopwatch.ElapsedMilliseconds,
                    DateTimeOffset.UtcNow);

                return new PreWarmPoolResult(poolName, true, 1);
            }

            var openedConnections = new List<NpgsqlConnection>(targetConnections);

            try
            {
                for (var i = 0; i < targetConnections; i++)
                {
                    var connection = new NpgsqlConnection(connectionString);
                    await connection.OpenAsync();
                    openedConnections.Add(connection);
                }
            }
            finally
            {
                foreach (var connection in openedConnections)
                {
                    await connection.CloseAsync();
                    await connection.DisposeAsync();
                }
            }

            poolStopwatch.Stop();

            logger.LogInformation(
                "Startup database pre-warm completed for {PoolName}. Host={Host}. Database={Database}. Pooling={Pooling}. MinPoolSize={MinPoolSize}. MaxPoolSize={MaxPoolSize}. ConnectionsWarmed={ConnectionsWarmed}. DurationMs={DurationMs}. CompletedAtUtc={CompletedAtUtc}.",
                poolName,
                builder.Host,
                builder.Database,
                builder.Pooling,
                minimumPoolSize,
                builder.MaxPoolSize,
                targetConnections,
                poolStopwatch.ElapsedMilliseconds,
                DateTimeOffset.UtcNow);

            return new PreWarmPoolResult(poolName, true, targetConnections);
        }
        catch (Exception ex)
        {
            logger.LogError(
                ex,
                "Database pre-warming failed during startup for {PoolName}. Host={Host}. Database={Database}. MinPoolSize={MinPoolSize}. MaxPoolSize={MaxPoolSize}.",
                poolName,
                builder.Host,
                builder.Database,
                builder.MinPoolSize,
                builder.MaxPoolSize);

            throw;
        }
    }

    private sealed record PreWarmPoolResult(string PoolName, bool WasWarmed, int ConnectionsWarmed);
}
