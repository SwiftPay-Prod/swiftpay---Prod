using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Swiftpay.Infrastructure.Data;

namespace Swiftpay.WebApi.Tests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private static readonly object _lock = new();
    private static bool _initialized;

    static CustomWebApplicationFactory()
    {
        SetupTestDatabase();
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
