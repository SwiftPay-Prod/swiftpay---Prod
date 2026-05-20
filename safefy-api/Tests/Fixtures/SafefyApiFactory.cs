using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Testcontainers.PostgreSql;

namespace safefy_api.Tests.Fixtures;

public class SafefyApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _dbContainer = new PostgreSqlBuilder()
        .WithImage("postgres:15.15-alpine3.22")
        .WithDatabase("safefy_test")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    public string ConnectionString => _dbContainer.GetConnectionString();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Test");

        builder.ConfigureAppConfiguration((context, config) =>
        {
            // Encontra o diretório raiz do projeto (onde está o .sln)
            var currentDir = new DirectoryInfo(Directory.GetCurrentDirectory());
            while (currentDir != null && !File.Exists(Path.Combine(currentDir.FullName, "safefy-api.sln")))
            {
                currentDir = currentDir.Parent;
            }
            
            if (currentDir == null)
                throw new DirectoryNotFoundException("Could not find project root directory");
            
            var basePath = currentDir.FullName;
            
            // Limpa configurações anteriores e carrega as novas
            config.Sources.Clear();
            config.SetBasePath(basePath)
                .AddJsonFile("appsettings.Development.json", optional: false, reloadOnChange: false)
                .AddJsonFile("appsettings.Test.json", optional: true, reloadOnChange: false);
            
            // Sobrescreve a connection string para usar o container de teste
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["DatabaseSettings:ConnectionString"] = _dbContainer.GetConnectionString()
            });
        });
    }

    public async Task InitializeAsync()
    {
        await _dbContainer.StartAsync();
    }

    public new async Task DisposeAsync()
    {
        await _dbContainer.StopAsync();
        await base.DisposeAsync();
    }
}

