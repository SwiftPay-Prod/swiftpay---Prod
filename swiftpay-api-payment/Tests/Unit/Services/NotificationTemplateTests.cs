using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using swiftpay_api_core.Constants;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Services;
using Testcontainers.PostgreSql;

namespace swiftpay_api_payment.Tests.Unit.Services;

public sealed class NotificationTemplateTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .Build();

    private DbContextOptions<PrimaryDbContext> _options = null!;

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();
        _options = new DbContextOptionsBuilder<PrimaryDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;

        await using var ctx = new PrimaryDbContext(_options);
        await ctx.Database.MigrateAsync();
    }

    public Task DisposeAsync() => _postgres.DisposeAsync().AsTask();

    [Fact]
    public async Task ResolvePushContentAsync_WithCustomTemplate_ShouldRenderPlaceholders()
    {
        await using var ctx = new PrimaryDbContext(_options);
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, Email = $"u+{userId}@test.com", Name = "U" };
        ctx.Users.Add(user);
        ctx.UserNotificationTemplates.Add(new UserNotificationTemplate
        {
            Id = Guid.CreateVersion7(),
            UserId = userId,
            Type = NotificationType.Payment,
            StatusType = NotificationStatusType.PaymentPending,
            TitleTemplate = "Pix {amount}",
            BodyTemplate = "Net {netAmount}",
            UpdatedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        });
        await ctx.SaveChangesAsync();

        var service = new NotificationService(ctx, new RecordingPushNotificationService(), NullLogger<NotificationService>.Instance);
        var (title, message) = await service.ResolvePushContentAsync(
            ctx,
            userId,
            NotificationType.Payment,
            NotificationStatusType.PaymentPending,
            new Dictionary<string, string> { ["amount"] = "10,00", ["netAmount"] = "9,50" },
            "default title",
            "default message");

        title.Should().Be("Pix 10,00");
        message.Should().Be("Net 9,50");
    }

    [Fact]
    public async Task ResolvePushContentAsync_WithUnknownPlaceholder_ShouldFallback()
    {
        await using var ctx = new PrimaryDbContext(_options);
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, Email = $"u+{userId}@test.com", Name = "U" };
        ctx.Users.Add(user);
        ctx.UserNotificationTemplates.Add(new UserNotificationTemplate
        {
            Id = Guid.CreateVersion7(),
            UserId = userId,
            Type = NotificationType.Payment,
            StatusType = NotificationStatusType.PaymentPending,
            TitleTemplate = "Pix {unknown}",
            BodyTemplate = "Body",
            UpdatedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        });
        await ctx.SaveChangesAsync();

        var service = new NotificationService(ctx, new RecordingPushNotificationService(), NullLogger<NotificationService>.Instance);
        var (title, _) = await service.ResolvePushContentAsync(
            ctx,
            userId,
            NotificationType.Payment,
            NotificationStatusType.PaymentPending,
            new Dictionary<string, string>(),
            "default title",
            "default message");

        title.Should().Be("default title");
    }

    [Fact]
    public async Task ResolvePushContentAsync_WithoutCustomTemplate_ShouldFallback()
    {
        await using var ctx = new PrimaryDbContext(_options);
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, Email = $"u+{userId}@test.com", Name = "U" };
        ctx.Users.Add(user);
        await ctx.SaveChangesAsync();

        var service = new NotificationService(ctx, new RecordingPushNotificationService(), NullLogger<NotificationService>.Instance);
        var (title, message) = await service.ResolvePushContentAsync(
            ctx,
            userId,
            NotificationType.Payment,
            NotificationStatusType.PaymentPending,
            null,
            "default title",
            "default message");

        title.Should().Be("default title");
        message.Should().Be("default message");
    }
}

public sealed class RecordingPushNotificationService : IPushNotificationService
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
