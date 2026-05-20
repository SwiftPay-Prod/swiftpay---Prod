using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using safefy_api_core.Models.Settings;
using safefy_api_core.Database;

namespace safefy_api_core.Extensions;

public static class LogDbContextExtensions
{
    public static IServiceCollection AddLogDbContext(
        this IServiceCollection services,
        string connectionString,
        string? migrationsAssembly = null)
    {
        services.AddDbContextFactory<LogDbContext>(options =>
            options.UseNpgsql(connectionString, npgsqlOptions =>
            {
                if (!string.IsNullOrEmpty(migrationsAssembly))
                {
                    npgsqlOptions.MigrationsAssembly(migrationsAssembly);
                }
            }));

        services.AddDbContext<LogDbContext>(options =>
            options.UseNpgsql(connectionString, npgsqlOptions =>
            {
                if (!string.IsNullOrEmpty(migrationsAssembly))
                {
                    npgsqlOptions.MigrationsAssembly(migrationsAssembly);
                }
            }));

        return services;
    }

    public static IServiceCollection AddLogDbContext(
        this IServiceCollection services,
        string? migrationsAssembly = null)
    {
        services.AddSingleton<IDbContextFactory<LogDbContext>>(sp =>
        {
            var settings = sp.GetRequiredService<IOptions<LogsDatabaseSettingsOptions>>().Value;
            var optionsBuilder = new DbContextOptionsBuilder<LogDbContext>();
            optionsBuilder.UseNpgsql(settings.ConnectionString, npgsqlOptions =>
            {
                if (!string.IsNullOrEmpty(migrationsAssembly))
                {
                    npgsqlOptions.MigrationsAssembly(migrationsAssembly);
                }
            });
            return new LogDbContextFactory(optionsBuilder.Options);
        });

        services.AddDbContext<LogDbContext>((serviceProvider, options) =>
        {
            var settings = serviceProvider
                .GetRequiredService<IOptions<LogsDatabaseSettingsOptions>>()
                .Value;
            
            options.UseNpgsql(settings.ConnectionString, npgsqlOptions =>
            {
                if (!string.IsNullOrEmpty(migrationsAssembly))
                {
                    npgsqlOptions.MigrationsAssembly(migrationsAssembly);
                }
            });
        });

        return services;
    }

    public static async Task EnsureLogDatabaseCreatedAsync(this IServiceProvider serviceProvider)
    {
        var factory = serviceProvider.GetRequiredService<IDbContextFactory<LogDbContext>>();
        await using var context = await factory.CreateDbContextAsync();
        await context.Database.MigrateAsync();
    }

    public static void EnsureLogDatabaseCreated(this IServiceProvider serviceProvider)
    {
        var factory = serviceProvider.GetRequiredService<IDbContextFactory<LogDbContext>>();
        using var context = factory.CreateDbContext();
        context.Database.Migrate();
    }
}

internal sealed class LogDbContextFactory(DbContextOptions<LogDbContext> options) : IDbContextFactory<LogDbContext>
{
    public LogDbContext CreateDbContext() => new(options);
}
