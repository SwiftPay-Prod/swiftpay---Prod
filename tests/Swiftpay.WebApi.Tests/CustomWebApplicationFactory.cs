using MassTransit;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.ApplicationParts;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Swiftpay.Api.Core.Consumers;
using Swiftpay.Api.Core.Providers.MagicPay;
using Swiftpay.Infrastructure.Data;

namespace Swiftpay.WebApi.Tests;

public class CustomWebApplicationFactory : WebApplicationFactory<Swiftpay.Api.Gestao.Program>
{
    private static readonly object _lock = new();
    private static IServiceProvider? _inMemoryServiceProvider;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureServices(services =>
        {
            // Add Payment API controllers to Gestao test host
            var paymentAssembly = typeof(Swiftpay.Api.Payment.Program).Assembly;
            var descriptor = services.FirstOrDefault(d => d.ServiceType == typeof(ApplicationPartManager));
            if (descriptor?.ImplementationInstance is ApplicationPartManager manager)
            {
                manager.ApplicationParts.Add(new AssemblyPart(paymentAssembly));
            }

            // Remove existing MassTransit RabbitMQ registrations, replace with in-memory
            RemoveMassTransitRegistrations(services);
            services.AddMassTransit(x =>
            {
                x.AddConsumersFromNamespaceContaining<PaymentCompletedConsumer>();
                x.UsingInMemory((context, cfg) =>
                {
                    cfg.ConfigureEndpoints(context);
                });
            });

            // Replace PostgreSQL with InMemory database for tests.
            // UseInternalServiceProvider isolates InMemory from the Npgsql provider
            // services already registered by AddInfrastructure.
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<AppDbContext>();

            var inMemorySp = GetOrCreateInMemoryServiceProvider();
            var dbName = $"SwiftpayTestDb_{Guid.NewGuid()}";
            services.AddDbContext<AppDbContext>(options =>
            {
                options.UseInMemoryDatabase(dbName)
                    .UseInternalServiceProvider(inMemorySp);
            });

            // Replace MagicPayClient with mock handler
            var magicPayDescriptor = services.FirstOrDefault(d => d.ServiceType == typeof(MagicPayClient));
            if (magicPayDescriptor != null) services.Remove(magicPayDescriptor);

            services.AddSingleton<MockMagicPayHandler>();
            services.AddTransient<MagicPayClient>(sp =>
            {
                var handler = sp.GetRequiredService<MockMagicPayHandler>();
                var parser = sp.GetRequiredService<MagicPayResponseParser>();
                var httpClient = new System.Net.Http.HttpClient(handler, disposeHandler: false)
                {
                    BaseAddress = new Uri("http://localhost")
                };
                return new MagicPayClient(httpClient, parser);
            });
        });
    }

    private static IServiceProvider GetOrCreateInMemoryServiceProvider()
    {
        if (_inMemoryServiceProvider != null)
            return _inMemoryServiceProvider;

        lock (_lock)
        {
            if (_inMemoryServiceProvider != null)
                return _inMemoryServiceProvider;

            _inMemoryServiceProvider = new ServiceCollection()
                .AddEntityFrameworkInMemoryDatabase()
                .BuildServiceProvider();

            return _inMemoryServiceProvider;
        }
    }

    private static void RemoveMassTransitRegistrations(IServiceCollection services)
    {
        var massTransitDescriptors = services
            .Where(d => d.ServiceType.FullName?.StartsWith("MassTransit") == true)
            .ToList();
        foreach (var desc in massTransitDescriptors)
            services.Remove(desc);
    }
}
