using Hangfire;
using Hangfire.Redis.StackExchange;
using safefy_api.Filters;
using safefy_api.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Settings;
using StackExchange.Redis;

namespace safefy_api.Extensions;

public static class HangfireExtensions
{
    public static IServiceCollection AddHangfireServices(this IServiceCollection services, IConfiguration configuration)
    {
        var valkeySettings = configuration.GetSection(ValkeySettings.SectionName).Get<ValkeySettings>();
        if (valkeySettings == null || string.IsNullOrEmpty(valkeySettings.ConnectionString))
            throw new InvalidOperationException("ValkeySettings:ConnectionString is required for Hangfire.");

        var configurationOptions = ConfigurationOptions.Parse(valkeySettings.ConnectionString);
        configurationOptions.CertificateValidation += (_, _, _, _) => true;

        var multiplexer = ConnectionMultiplexer.Connect(configurationOptions);
        services.AddSingleton<IConnectionMultiplexer>(multiplexer);

        services.AddHangfire((sp, config) =>
        {
            var redis = sp.GetRequiredService<IConnectionMultiplexer>();

            config
                .SetDataCompatibilityLevel(CompatibilityLevel.Version_170)
                .UseSimpleAssemblyNameTypeSerializer()
                .UseRecommendedSerializerSettings()
                .UseRedisStorage(redis, new RedisStorageOptions
                {
                    Prefix = "safefy:hangfire:",
                    Db = 0,
                    InvisibilityTimeout = TimeSpan.FromMinutes(30),
                    ExpiryCheckInterval = TimeSpan.FromMinutes(5),
                    FetchTimeout = TimeSpan.FromSeconds(1)
                });

            config.UseFilter(new SkipConcurrentExecutionFilter(redis, TimeSpan.FromMinutes(10)));
        });

        services.AddHangfireServer(options =>
        {
            options.WorkerCount = 2;
            options.Queues = ["automatic-cashout", "ranking"];
            options.ServerName = $"safefy-api-{Environment.MachineName}";
        });

        return services;
    }

    public static WebApplication UseHangfireJobs(this WebApplication app)
    {
        var jobManager = app.Services.GetRequiredService<IRecurringJobManager>();
        RegisterRecurringJobs(jobManager);
        return app;
    }

    private static void RegisterRecurringJobs(IRecurringJobManager jobManager)
    {
        var options = new RecurringJobOptions
        {
            TimeZone = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo")
        };

        jobManager.AddOrUpdate<IAutomaticCashoutService>(
            "automatic-merchant-cashout-hourly",
            "automatic-cashout",
            service => service.ProcessMerchantCashoutsAsync(CancellationToken.None),
            Cron.Minutely,
            options);

        jobManager.AddOrUpdate<IAutomaticCashoutService>(
            "automatic-platform-cashout-hourly",
            "automatic-cashout",
            service => service.ProcessPlatformCashoutAsync(CancellationToken.None),
            Cron.Minutely,
            options);

        jobManager.AddOrUpdate<IRankingSchedulerService>(
            "ranking-process-production",
            "ranking",
            service => service.QueueProductionRankingsAsync(CancellationToken.None),
            "*/5 * * * *",
            options);
    }
}
