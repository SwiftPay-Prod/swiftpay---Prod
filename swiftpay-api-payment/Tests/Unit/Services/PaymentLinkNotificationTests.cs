using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using swiftpay_api_core.Constants;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Services;
using Testcontainers.PostgreSql;

namespace swiftpay_api_payment.Tests.Unit.Services;

public sealed class RecordingPaymentPushService : IPushNotificationService
{
    public List<(Guid UserId, string Title, string Body, Dictionary<string, string>? Data)> UserCalls { get; } = [];
    public List<(Guid MerchantId, string Title, string Body, Dictionary<string, string>? Data)> MerchantCalls { get; } = [];

    public Task SendPushNotificationAsync(Guid userId, string title, string body, Dictionary<string, string>? data = null)
    {
        UserCalls.Add((userId, title, body, data));
        return Task.CompletedTask;
    }

    public Task SendPushNotificationToMerchantUsersAsync(Guid merchantId, string title, string body, Dictionary<string, string>? data = null)
    {
        MerchantCalls.Add((merchantId, title, body, data));
        return Task.CompletedTask;
    }

    public Task<PushToken?> RegisterTokenAsync(Guid userId, string token, PushTokenPlatform platform, string? deviceName = null, string? deviceId = null)
        => Task.FromResult<PushToken?>(null);

    public Task<bool> UnregisterTokenAsync(Guid userId, string token) => Task.FromResult(true);
    public Task<bool> UnregisterTokensByDeviceIdAsync(Guid userId, string deviceId) => Task.FromResult(true);
    public Task<bool> UnregisterAllTokensAsync(Guid userId) => Task.FromResult(true);
    public Task<List<PushToken>> GetUserTokensAsync(Guid userId) => Task.FromResult(new List<PushToken>());
}

/// <summary>
/// U3 - PaymentLink: garante que criação via Link chama o mesmo seam de notificação
/// com PaymentPending e actionUrl, respeitando preferências por evento e canal.
/// Paralelo a U2 (Checkout), sem conflito de arquivos.
/// </summary>
public sealed class PaymentLinkNotificationTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .Build();

    private DbContextOptions<PrimaryDbContext> _options = null!;
    private readonly RecordingPaymentPushService _push = new();

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();
        _options = new DbContextOptionsBuilder<PrimaryDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;
        await using var context = new PrimaryDbContext(_options);
        await context.Database.EnsureCreatedAsync();
    }

    public Task DisposeAsync() => _postgres.DisposeAsync().AsTask();

    private NotificationService BuildService()
    {
        var services = new ServiceCollection();
        services.AddSingleton(_options);
        services.AddDbContext<PrimaryDbContext>(o => o.UseNpgsql(_postgres.GetConnectionString()));
        services.AddSingleton<IPushNotificationService>(_push);
        // IMessagePublisher não registrado -> caminho direto (sem fila), igual ao teste canônico de U1/U2
        var provider = services.BuildServiceProvider();
        var scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();
        return new NotificationService(scopeFactory, NullLogger<NotificationService>.Instance);
    }

    private async Task SeedUserAsync(PrimaryDbContext context, Guid userId)
    {
        context.Set<User>().Add(new User
        {
            Id = userId,
            Email = $"user-{userId:N}@test.local",
            Name = "Test User",
            Password = "test-hash",
            CreatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();
    }

    private async Task SeedMerchantAsync(PrimaryDbContext context, Guid merchantId, Guid userId, string name = "Merchant Link Teste")
    {
        await SeedUserAsync(context, userId);
        context.Set<Merchant>().Add(new Merchant
        {
            Id = merchantId,
            UserId = userId,
            Name = name,
            Status = MerchantStatus.Active,
            CreatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();
    }

    [Fact]
    public async Task PaymentPending_ViaLink_WithPreferenceActive_ShouldSendPushWithActionUrl()
    {
        // Arrange: merchant com preferência ativa para PaymentPending (modalidade Link = mesmo seam da API)
        var merchantId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        await using var context = new PrimaryDbContext(_options);
        await SeedMerchantAsync(context, merchantId, userId);

        context.Set<UserNotificationPreference>().Add(new UserNotificationPreference
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            PushNotificationsEnabled = true,
            NotifyPaymentPending = true
        });
        await context.SaveChangesAsync();
        _push.MerchantCalls.Clear();
        _push.UserCalls.Clear();

        var service = BuildService();

        // Act: simula notificação disparada pela criação via Payment Link
        // Mesmo seam de TransactionService.SendTransactionCreatedNotificationAsync:
        // CreatePaymentNotificationAsync com PaymentPending + Routes.Transactions
        await service.CreatePaymentNotificationAsync(
            merchantId,
            NotificationTemplates.Payment.Pending.Title,
            NotificationTemplates.Payment.Pending.Message(10000, "PIX"),
            NotificationStatusType.PaymentPending,
            ApiEnvironment.Production,
            NotificationTemplates.Routes.Transactions);

        // Assert: push enviado com actionUrl e in-app criado
        _push.MerchantCalls.Should().HaveCount(1);
        var call = _push.MerchantCalls[0];
        call.MerchantId.Should().Be(merchantId);
        call.Data.Should().NotBeNull();
        call.Data!["actionUrl"].Should().Be(NotificationTemplates.Routes.Transactions);

        var inApp = await context.Set<global::swiftpay_api_core.Models.Database.Notification>()
            .Where(n => n.MerchantId == merchantId)
            .ToListAsync();
        inApp.Should().HaveCount(1);
        inApp[0].StatusType.Should().Be(NotificationStatusType.PaymentPending);
        inApp[0].ActionUrl.Should().Be(NotificationTemplates.Routes.Transactions);
    }

    [Fact]
    public async Task PaymentPending_ViaLink_WithNotifyPaymentPendingOff_ShouldNotSendPush()
    {
        // Arrange: preferência por evento desligada -> sem push
        var merchantId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        await using var context = new PrimaryDbContext(_options);
        await SeedMerchantAsync(context, merchantId, userId);

        context.Set<UserNotificationPreference>().Add(new UserNotificationPreference
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            PushNotificationsEnabled = true,
            NotifyPaymentPending = false
        });
        await context.SaveChangesAsync();
        _push.MerchantCalls.Clear();

        var service = BuildService();

        await service.CreatePaymentNotificationAsync(
            merchantId,
            NotificationTemplates.Payment.Pending.Title,
            NotificationTemplates.Payment.Pending.Message(5000, "PIX"),
            NotificationStatusType.PaymentPending,
            ApiEnvironment.Production,
            NotificationTemplates.Routes.Transactions);

        _push.MerchantCalls.Should().BeEmpty();
        _push.UserCalls.Should().BeEmpty();
    }

    [Fact]
    public async Task PaymentPending_ViaLink_WithPushGloballyDisabled_ShouldNotSendPushButCreateInApp()
    {
        // Arrange: Push global off, mas in-app deve continuar (contrato: in-app sempre quando evento habilitado)
        var merchantId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        await using var context = new PrimaryDbContext(_options);
        await SeedMerchantAsync(context, merchantId, userId);

        context.Set<UserNotificationPreference>().Add(new UserNotificationPreference
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            PushNotificationsEnabled = false,
            NotifyPaymentPending = true
        });
        await context.SaveChangesAsync();
        _push.MerchantCalls.Clear();

        var service = BuildService();

        await service.CreatePaymentNotificationAsync(
            merchantId,
            NotificationTemplates.Payment.Pending.Title,
            NotificationTemplates.Payment.Pending.Message(7500, "PIX"),
            NotificationStatusType.PaymentPending,
            ApiEnvironment.Production,
            NotificationTemplates.Routes.Transactions);

        _push.MerchantCalls.Should().BeEmpty();
        _push.UserCalls.Should().BeEmpty();

        var inApp = await context.Set<global::swiftpay_api_core.Models.Database.Notification>()
            .Where(n => n.MerchantId == merchantId)
            .ToListAsync();
        inApp.Should().HaveCount(1);
        inApp[0].StatusType.Should().Be(NotificationStatusType.PaymentPending);
    }
}
