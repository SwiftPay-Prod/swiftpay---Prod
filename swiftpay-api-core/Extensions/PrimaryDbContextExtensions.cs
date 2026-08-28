using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Npgsql;
using swiftpay_api_core.Database;
using swiftpay_api_core.Models.Settings;

public static class PrimaryDbContextExtensions
{
    public static IServiceCollection AddPrimaryDbContext(
        this IServiceCollection services,
        string connectionString,
        string? migrationsAssembly = null)
    {
        var dataSourceBuilder = new NpgsqlDataSourceBuilder(connectionString);
        dataSourceBuilder.EnableDynamicJson();
        var dataSource = dataSourceBuilder.Build();

        services.AddSingleton(dataSource);

        services.AddDbContext<PrimaryDbContext>(options =>
        {
            options.ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning));
            options.UseNpgsql(dataSource, npgsqlOptions =>
            {
                npgsqlOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
                
                if (!string.IsNullOrEmpty(migrationsAssembly))
                {
                    npgsqlOptions.MigrationsAssembly(migrationsAssembly);
                }
            });
        });
        services.AddScoped<DbContext>(sp => sp.GetRequiredService<PrimaryDbContext>());

        return services;
    }

    public static IServiceCollection AddPrimaryDbContext(
        this IServiceCollection services,
        string? migrationsAssembly = null)
    {
        services.AddSingleton<NpgsqlDataSource>(sp =>
        {
            var settings = sp.GetRequiredService<IOptions<DatabaseSettingsOptions>>().Value;
            var dataSourceBuilder = new NpgsqlDataSourceBuilder(settings.ConnectionString);
            dataSourceBuilder.EnableDynamicJson();
            return dataSourceBuilder.Build();
        });

        services.AddDbContext<PrimaryDbContext>((serviceProvider, options) =>
        {
            var dataSource = serviceProvider.GetRequiredService<NpgsqlDataSource>();
            
            options.ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning));
            options.UseNpgsql(dataSource, npgsqlOptions =>
            {
                npgsqlOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
                
                if (!string.IsNullOrEmpty(migrationsAssembly))
                {
                    npgsqlOptions.MigrationsAssembly(migrationsAssembly);
                }
            });
        });
        services.AddScoped<DbContext>(sp => sp.GetRequiredService<PrimaryDbContext>());

        return services;
    }

    public static async Task EnsurePrimaryDatabaseCreatedAsync(
        this IServiceProvider serviceProvider,
        Action<PrimaryDbContext>? initialize = null)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();
        
        await context.Database.MigrateAsync();
        initialize?.Invoke(context);
    }

    public static void EnsurePrimaryDatabaseCreated(
        this IServiceProvider serviceProvider,
        Action<PrimaryDbContext>? initialize = null)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();
        
        context.Database.Migrate();
        initialize?.Invoke(context);
    }
}
