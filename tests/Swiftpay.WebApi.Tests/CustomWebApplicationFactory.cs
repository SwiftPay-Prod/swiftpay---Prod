using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.ApplicationParts;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Swiftpay.Infrastructure.Data;

namespace Swiftpay.WebApi.Tests;

public class CustomWebApplicationFactory : WebApplicationFactory<Swiftpay.Api.Gestao.Program>
{
    private static readonly object _lock = new();
    private static bool _initialized;

    static CustomWebApplicationFactory()
    {
        SetupTestDatabase();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            var paymentAssembly = typeof(Swiftpay.Api.Payment.Program).Assembly;
            var descriptor = services.FirstOrDefault(d => d.ServiceType == typeof(ApplicationPartManager));
            if (descriptor?.ImplementationInstance is ApplicationPartManager manager)
            {
                manager.ApplicationParts.Add(new AssemblyPart(paymentAssembly));
            }
        });
    }

    private static void SetupTestDatabase()
    {
        if (_initialized) return;
        lock (_lock)
        {
            if (_initialized) return;

            var connStr = "Host=localhost;Port=5432;Database=swiftpay_test;Username=swiftpay;Password=swiftpay123";

            Environment.SetEnvironmentVariable(
                "ConnectionStrings__DefaultConnection", connStr);

            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseNpgsql(connStr)
                .Options;

            using var db = new AppDbContext(options);
            db.Database.EnsureDeleted();
            db.Database.Migrate();

            _initialized = true;
        }
    }
}
