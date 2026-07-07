using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using swiftpay_api_payment.Interfaces.Internal;
using swiftpay_api_payment.Tests.Models;
using swiftpay_api_core.Database;
using Testcontainers.PostgreSql;

namespace swiftpay_api_payment.Tests.Fixtures;

/// <summary>
/// Factory para criar instâncias da API de pagamento para testes de integração.
/// Utiliza Testcontainers para criar um banco PostgreSQL isolado.
/// </summary>
public class PaymentApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _dbContainer = new PostgreSqlBuilder()
        .WithImage("postgres:15.15-alpine3.22")
        .WithDatabase("swiftpay_payment_test")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    public string ConnectionString => _dbContainer.GetConnectionString();
    private bool _initialized = false;
    private bool _multiMerchantInitialized = false;
    private string? _cachedToken;
    private DateTime _tokenExpiry = DateTime.MinValue;
    private readonly SemaphoreSlim _tokenLock = new(1, 1);
    private readonly Dictionary<string, string> _merchantTokenCache = new();

    public async Task<string> GetOrCacheTokenAsync(HttpClient client)
    {
        if (_cachedToken != null && DateTime.UtcNow < _tokenExpiry)
            return _cachedToken;

        await _tokenLock.WaitAsync();
        try
        {
            if (_cachedToken != null && DateTime.UtcNow < _tokenExpiry)
                return _cachedToken;

            var tokenRequest = new
            {
                GrantType = "client_credentials",
                PublicKey = TestDataSeeder.TestClientId,
                SecretKey = TestDataSeeder.TestClientSecret
            };
            var response = await client.PostAsJsonAsync("/v1/auth/token", tokenRequest);
            var content = await response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode)
                throw new InvalidOperationException($"Token request failed ({response.StatusCode}): {content}");

            var opts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var result = JsonSerializer.Deserialize<TokenResponse>(content, opts);
            _cachedToken = result!.Data!.AccessToken;
            _tokenExpiry = DateTime.UtcNow.AddMinutes(50);
            return _cachedToken;
        }
        finally
        {
            _tokenLock.Release();
        }
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Encontra o diretório raiz do projeto (onde está o .sln)
        var currentDir = new DirectoryInfo(Directory.GetCurrentDirectory());
        while (currentDir != null && !File.Exists(Path.Combine(currentDir.FullName, "swiftpay-api-payment.sln")))
        {
            currentDir = currentDir.Parent;
        }
        
        if (currentDir == null)
            throw new DirectoryNotFoundException("Could not find project root directory");
        
        var basePath = currentDir.FullName;
        
        // Define o ContentRoot para evitar duplicação de paths
        builder.UseContentRoot(basePath);
        builder.UseEnvironment("Development");

        builder.ConfigureLogging(logging =>
        {
            logging.ClearProviders();
            logging.SetMinimumLevel(LogLevel.None);
        });

        builder.ConfigureAppConfiguration((context, config) =>
        {
            // Limpa configurações anteriores e carrega as novas
            config.Sources.Clear();
            config.SetBasePath(basePath)
                .AddJsonFile("appsettings.Development.json", optional: false, reloadOnChange: false);
            
            // Sobrescreve a connection string para usar o container de teste
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["DatabaseSettings:ConnectionString"] = _dbContainer.GetConnectionString()
            });
        });

        builder.ConfigureTestServices(services =>
        {
            services.AddScoped<IRateLimitService, NoOpRateLimitService>();
        });
    }

    /// <summary>
    /// Obtém ou cacheia o token de autenticação para um merchant específico.
    /// </summary>
    public async Task<string> GetOrCacheMerchantTokenAsync(HttpClient client, string clientId, string clientSecret)
    {
        if (_merchantTokenCache.TryGetValue(clientId, out var cached))
            return cached;

        var tokenRequest = new
        {
            GrantType = "client_credentials",
            PublicKey = clientId,
            SecretKey = clientSecret
        };

        var response = await client.PostAsJsonAsync("/v1/auth/token", tokenRequest);
        var content = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"Token request failed ({response.StatusCode}): {content}");

        var opts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var result = JsonSerializer.Deserialize<TokenResponse>(content, opts);
        var token = result!.Data!.AccessToken;
        _merchantTokenCache[clientId] = token;
        return token;
    }

    /// <summary>
    /// Garante que o banco está inicializado e seedado.
    /// Deve ser chamado no início de cada teste.
    /// </summary>
    public async Task SeedTestDataAsync()
    {
        if (_initialized) return;
        
        using var scope = Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();
        
        await dbContext.Database.EnsureCreatedAsync();
        
        await TestDataSeeder.SeedAsync(dbContext);
        _initialized = true;
    }

    /// <summary>
    /// Seed dos 3 merchants extras usados no teste de fluxo completo (Alpha, Beta, Gamma).
    /// Garante que o seed base já foi executado antes.
    /// </summary>
    public async Task SeedMultiMerchantDataAsync()
    {
        if (!_initialized) await SeedTestDataAsync();
        if (_multiMerchantInitialized) return;

        using var scope = Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();
        await MultiMerchantSeeder.SeedAsync(dbContext);
        _multiMerchantInitialized = true;
    }

    /// <summary>
    /// Cleanup completo para o teste de fluxo da plataforma:
    /// limpa payments, payouts, ledger e zera TODAS as contas (merchants + sistema + adquirentes).
    /// </summary>
    public async Task CleanupForFullFlowAsync()
    {
        await Task.Delay(1500);

        using var scope = Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();

        var paymentsPix = await dbContext.PaymentsPix.IgnoreQueryFilters().ToListAsync();
        dbContext.PaymentsPix.RemoveRange(paymentsPix);

        var payments = await dbContext.Payments.IgnoreQueryFilters().ToListAsync();
        dbContext.Payments.RemoveRange(payments);

        var ledgerTransactions = await dbContext.LedgerTransactions.IgnoreQueryFilters().ToListAsync();
        dbContext.LedgerTransactions.RemoveRange(ledgerTransactions);

        var payouts = await dbContext.Payouts.IgnoreQueryFilters().ToListAsync();
        dbContext.Payouts.RemoveRange(payouts);

        // Zera TODAS as contas: merchant, plataforma e adquirente
        var allAccounts = await dbContext.Accounts.IgnoreQueryFilters().ToListAsync();
        foreach (var account in allAccounts)
        {
            account.Balance = 0;
        }

        // Zera todos os KPIs históricos de merchants
        var allMerchantBalances = await dbContext.MerchantBalances.IgnoreQueryFilters().ToListAsync();
        foreach (var mb in allMerchantBalances)
        {
            mb.LifetimeVolume = 0;
            mb.LifetimeFeesPaid = 0;
            mb.LifetimePayouts = 0;
            mb.LifetimeRefunds = 0;
            mb.VolumeToday = 0;
            mb.VolumeThisWeek = 0;
            mb.VolumeThisMonth = 0;
        }

        _merchantTokenCache.Clear();
        _cachedToken = null;
        _tokenExpiry = DateTime.MinValue;

        await dbContext.SaveChangesAsync();
    }

    /// <summary>
    /// Limpa os dados de Payments e PaymentPix para permitir testes isolados.
    /// Deve ser chamado após cada teste para evitar conflitos de external_id.
    /// </summary>
    public async Task CleanupPaymentsAsync()
    {
        // Aguarda consumidores em background (ProcessCashoutConsumer) finalizarem antes
        // de deletar registros, evitando violação de FK ao remover Payouts enquanto o
        // consumer ainda tenta inserir LedgerTransactions referenciando o PayoutId.
        await Task.Delay(1500);

        using var scope = Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();
        
        // IMPORTANTE: IgnoreQueryFilters() é necessário em todo scope sem HTTP request.
        // Sem request, CurrentEnvironment defaults para Production, mas dados de teste são Sandbox.
        // Sem isso, todas as queries retornam 0 resultados e a cleanup não faz nada.

        // Limpa PaymentPix primeiro (FK de Payments)
        var paymentsPix = await dbContext.PaymentsPix.IgnoreQueryFilters().ToListAsync();
        dbContext.PaymentsPix.RemoveRange(paymentsPix);

        // Limpa Payments
        var payments = await dbContext.Payments.IgnoreQueryFilters().ToListAsync();
        dbContext.Payments.RemoveRange(payments);

        // Limpa LedgerTransactions (antes dos Payouts por FK)
        var ledgerTransactions = await dbContext.LedgerTransactions.IgnoreQueryFilters().ToListAsync();
        dbContext.LedgerTransactions.RemoveRange(ledgerTransactions);

        // Limpa Payouts (cashouts de merchants)
        var payouts = await dbContext.Payouts.IgnoreQueryFilters().ToListAsync();
        dbContext.Payouts.RemoveRange(payouts);

        // Reset o balance das contas dos merchants para 0
        var merchantAccounts = await dbContext.Accounts
            .IgnoreQueryFilters()
            .Where(a => a.MerchantId != null)
            .ToListAsync();
        foreach (var account in merchantAccounts)
        {
            account.Balance = 0;
        }

        // Reset KPIs históricos para garantir isolamento total dos testes de ledger
        var merchantBalances = await dbContext.MerchantBalances
            .IgnoreQueryFilters()
            .Where(b => b.MerchantId != default)
            .ToListAsync();
        foreach (var mb in merchantBalances)
        {
            mb.LifetimeVolume = 0;
            mb.LifetimeFeesPaid = 0;
            mb.LifetimePayouts = 0;
            mb.LifetimeRefunds = 0;
            mb.VolumeToday = 0;
            mb.VolumeThisWeek = 0;
            mb.VolumeThisMonth = 0;
        }

        await dbContext.SaveChangesAsync();
    }

    public async Task InitializeAsync()
    {
        await _dbContainer.StartAsync();
        await PurgeRabbitMqQueuesAsync();
    }

    public new async Task DisposeAsync()
    {
        await _dbContainer.StopAsync();
        await base.DisposeAsync();
    }

    /// <summary>
    /// Purga as filas do RabbitMQ compartilhado para evitar que mensagens
    /// de runs anteriores sejam reprocessadas contra um DB limpo (causando
    /// FK violations e "Payout not found" nos logs de teste).
    /// </summary>
    private static async Task PurgeRabbitMqQueuesAsync()
    {
        using var http = new HttpClient();
        var credentials = Convert.ToBase64String("swiftpayuser:swiftpaypassword"u8.ToArray());
        http.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", credentials);

        try
        {
            var queues = await http.GetFromJsonAsync<List<RabbitMqQueueInfo>>(
                "http://localhost:15672/api/queues/swiftpay");

            if (queues == null || queues.Count == 0)
            {
                return;
            }

            foreach (var queue in queues)
            {
                if (string.IsNullOrWhiteSpace(queue.Name))
                {
                    continue;
                }

                await http.DeleteAsync(
                    $"http://localhost:15672/api/queues/swiftpay/{Uri.EscapeDataString(queue.Name)}/contents");
            }
        }
        catch
        {
            // RabbitMQ pode estar indisponivel (CI sem broker) – ignorar silenciosamente.
        }
    }

    private sealed class RabbitMqQueueInfo
    {
        public string Name { get; set; } = string.Empty;
    }
}
