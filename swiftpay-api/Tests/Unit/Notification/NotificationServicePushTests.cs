using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Services;
using Testcontainers.PostgreSql;

namespace swiftpay_api.Tests.Unit.Notification;

public sealed class RecordingPushService : IPushNotificationService
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

public sealed class NotificationServicePushTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .Build();

    private DbContextOptions<PrimaryDbContext> _options = null!;
    private readonly RecordingPushService _push = new();

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
        // IMessagePublisher não registrado → NotificationService cai no caminho direto (sem fila)
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

    private async Task SeedMerchantAsync(PrimaryDbContext context, Guid merchantId, Guid userId, string name = "Merchant Teste")
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
    public async Task PaymentCompleted_WithDefaultPreferences_ShouldSendPushAndCreateInApp()
    {
        var merchantId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        await using var context = new PrimaryDbContext(_options);
        await SeedMerchantAsync(context, merchantId, userId);

        context.Set<UserNotificationPreference>().Add(new UserNotificationPreference
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            PushNotificationsEnabled = true,
            NotifyPaymentCompleted = true
        });
        await context.SaveChangesAsync();
        _push.UserCalls.Clear();
        _push.MerchantCalls.Clear();

        var service = BuildService();
        await service.CreatePaymentNotificationAsync(
            merchantId,
            "Pagamento aprovado",
            "Você recebeu R$ 100,00",
            NotificationStatusType.PaymentCompleted,
            ApiEnvironment.Production,
            "/panel/merchant/transactions");

        _push.MerchantCalls.Should().HaveCount(1);
        var call = _push.MerchantCalls[0];
        call.MerchantId.Should().Be(merchantId);
        call.Data.Should().NotBeNull();
        call.Data!["actionUrl"].Should().Be("/panel/merchant/transactions");

        var inApp = await context.Set<global::swiftpay_api_core.Models.Database.Notification>()
            .Where(n => n.MerchantId == merchantId)
            .ToListAsync();
        inApp.Should().HaveCount(1);
        inApp[0].StatusType.Should().Be(NotificationStatusType.PaymentCompleted);
    }

    [Fact]
    public async Task PaymentCompleted_WithPushDisabled_ShouldNotSendPushButCreateInApp()
    {
        var merchantId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        await using var context = new PrimaryDbContext(_options);
        await SeedMerchantAsync(context, merchantId, userId);

        context.Set<UserNotificationPreference>().Add(new UserNotificationPreference
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            PushNotificationsEnabled = false,
            NotifyPaymentCompleted = true
        });
        await context.SaveChangesAsync();
        _push.UserCalls.Clear();
        _push.MerchantCalls.Clear();

        var service = BuildService();
        await service.CreatePaymentNotificationAsync(
            merchantId,
            "Pagamento aprovado",
            "Você recebeu R$ 100,00",
            NotificationStatusType.PaymentCompleted,
            ApiEnvironment.Production,
            "/panel/merchant/transactions");

        _push.MerchantCalls.Should().BeEmpty();
        _push.UserCalls.Should().BeEmpty();

        var inApp = await context.Set<global::swiftpay_api_core.Models.Database.Notification>()
            .Where(n => n.MerchantId == merchantId)
            .ToListAsync();
        inApp.Should().HaveCount(1);
    }

    [Fact]
    public async Task PaymentCompleted_WithEventToggleOff_ShouldNotSendPushForThatEvent()
    {
        var merchantId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        await using var context = new PrimaryDbContext(_options);
        await SeedMerchantAsync(context, merchantId, userId);

        context.Set<UserNotificationPreference>().Add(new UserNotificationPreference
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            PushNotificationsEnabled = true,
            NotifyPaymentCompleted = false,
            NotifyPaymentFailed = true
        });
        await context.SaveChangesAsync();
        _push.MerchantCalls.Clear();

        var service = BuildService();
        await service.CreatePaymentNotificationAsync(
            merchantId, "Pagamento aprovado", "R$ 100,00",
            NotificationStatusType.PaymentCompleted, ApiEnvironment.Production, "/panel/merchant/transactions");

        _push.MerchantCalls.Should().BeEmpty();
    }

    [Fact]
    public async Task PaymentFailed_WithEventOn_ShouldSendPushWithActionUrl()
    {
        var merchantId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        await using var context = new PrimaryDbContext(_options);
        await SeedMerchantAsync(context, merchantId, userId);

        context.Set<UserNotificationPreference>().Add(new UserNotificationPreference
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            PushNotificationsEnabled = true,
            NotifyPaymentFailed = true,
            NotifyPaymentCompleted = false
        });
        await context.SaveChangesAsync();
        _push.MerchantCalls.Clear();

        var service = BuildService();
        await service.CreatePaymentNotificationAsync(
            merchantId, "Pagamento recusado", "Falha no pagamento",
            NotificationStatusType.PaymentFailed, ApiEnvironment.Production, "/panel/merchant/transactions");

        _push.MerchantCalls.Should().HaveCount(1);
        _push.MerchantCalls[0].Data!["actionUrl"].Should().Be("/panel/merchant/transactions");
    }

    [Fact]
    public async Task NoPushTokens_ShouldStillCreateInAppWithoutThrowing()
    {
        var merchantId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        await using var context = new PrimaryDbContext(_options);
        await SeedMerchantAsync(context, merchantId, userId);

        var service = BuildService();
        await service.CreatePaymentNotificationAsync(
            merchantId, "Pagamento aprovado", "R$ 100,00",
            NotificationStatusType.PaymentCompleted, ApiEnvironment.Production);

        var inApp = await context.Set<global::swiftpay_api_core.Models.Database.Notification>()
            .Where(n => n.MerchantId == merchantId)
            .ToListAsync();
        inApp.Should().HaveCount(1);
    }

    [Fact]
    public async Task PaymentRefunded_WithEventOn_ShouldSendPushWithActionUrl()
    {
        var merchantId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        await using var context = new PrimaryDbContext(_options);
        await SeedMerchantAsync(context, merchantId, userId);

        context.Set<UserNotificationPreference>().Add(new UserNotificationPreference
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            PushNotificationsEnabled = true,
            NotifyPaymentRefunded = true,
            NotifyPaymentCompleted = false
        });
        await context.SaveChangesAsync();
        _push.MerchantCalls.Clear();

        var service = BuildService();
        await service.CreatePaymentNotificationAsync(
            merchantId, "Pagamento reembolsado", "R$ 50,00 devolvidos",
            NotificationStatusType.PaymentRefunded, ApiEnvironment.Production, "/panel/merchant/transactions");

        _push.MerchantCalls.Should().HaveCount(1);
        _push.MerchantCalls[0].Data!["actionUrl"].Should().Be("/panel/merchant/transactions");
    }

    [Theory]
    [InlineData(NotificationStatusType.PayoutCompleted, "/payouts/payout-1")]
    [InlineData(NotificationStatusType.PayoutFailed, "/payouts/payout-2")]
    [InlineData(NotificationStatusType.PayoutRejected, "/panel/merchant/cashouts")]
    [InlineData(NotificationStatusType.PayoutProcessing, "/payouts/payout-4")]
    public async Task PayoutTransitions_WithEventOn_ShouldSendPushWithActionUrl(NotificationStatusType statusType, string actionUrl)
    {
        var merchantId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        await using var context = new PrimaryDbContext(_options);
        await SeedMerchantAsync(context, merchantId, userId);

        context.Set<UserNotificationPreference>().Add(new UserNotificationPreference
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            PushNotificationsEnabled = true
        });
        await context.SaveChangesAsync();
        _push.MerchantCalls.Clear();

        var service = BuildService();
        await service.CreatePayoutNotificationAsync(
            merchantId, $"Payout {statusType}", "Seu saque foi atualizado",
            statusType, ApiEnvironment.Production, actionUrl);

        _push.MerchantCalls.Should().HaveCount(1);
        _push.MerchantCalls[0].Data!["actionUrl"].Should().Be(actionUrl);
    }

    [Fact]
    public async Task PayoutCompleted_WithEventOff_ShouldNotSendPush()
    {
        var merchantId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        await using var context = new PrimaryDbContext(_options);
        await SeedMerchantAsync(context, merchantId, userId);

        context.Set<UserNotificationPreference>().Add(new UserNotificationPreference
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            PushNotificationsEnabled = true,
            NotifyPayoutCompleted = false
        });
        await context.SaveChangesAsync();
        _push.MerchantCalls.Clear();

        var service = BuildService();
        await service.CreatePayoutNotificationAsync(
            merchantId, "Saque concluído", "R$ 500,00",
            NotificationStatusType.PayoutCompleted, ApiEnvironment.Production, "/payouts/payout-1");

        _push.MerchantCalls.Should().BeEmpty();
    }
}
