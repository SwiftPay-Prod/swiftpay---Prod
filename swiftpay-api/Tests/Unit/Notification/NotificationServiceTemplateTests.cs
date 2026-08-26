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

public sealed class NotificationServiceTemplateTests : IAsyncLifetime
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

    [Fact]
    public async Task CustomTemplate_RendersEscapedPlaceholdersForPush()
    {
        var merchantId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        await using var context = new PrimaryDbContext(_options);
        await SeedMerchantAsync(context, merchantId, userId);
        context.UserNotificationTemplates.Add(new UserNotificationTemplate
        {
            Id = Guid.CreateVersion7(),
            UserId = userId,
            Type = NotificationType.Payment,
            StatusType = NotificationStatusType.PaymentCompleted,
            TitleTemplate = "Venda de {amount} aprovada",
            BodyTemplate = "Cliente {customerName} pagou {netAmount} no pedido {orderId}",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        var service = BuildService();
        await service.CreateWithTemplateAsync(
            merchantId,
            NotificationType.Payment,
            "Venda aprovada",
            "Líquido recebido: R$ 495,00.",
            statusType: NotificationStatusType.PaymentCompleted,
            templateData: new Dictionary<string, string>
            {
                ["amount"] = "R$ 500,00",
                ["netAmount"] = "<b>R$ 495,00</b>",
                ["customerName"] = "<script>alert('x')</script>",
                ["orderId"] = "ORD-123"
            });

        _push.MerchantCalls.Should().ContainSingle();
        var push = _push.MerchantCalls.Single();
        push.Title.Should().Be("Venda de R$ 500,00 aprovada");
        push.Body.Should().Be("Cliente &lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt; pagou &lt;b&gt;R$ 495,00&lt;/b&gt; no pedido ORD-123");

        var inApp = await context.Notifications.SingleAsync(notification => notification.MerchantId == merchantId);
        inApp.Title.Should().Be("Venda aprovada");
        inApp.Message.Should().Be("Líquido recebido: R$ 495,00.");
    }

    [Fact]
    public void UnknownPlaceholder_ThrowsValidationErrorWithEmailRendererShape()
    {
        Action render = () => NotificationTemplateRenderer.Render(
            "Venda {unknown}",
            new Dictionary<string, string>());

        var exception = render.Should()
            .Throw<NotificationTemplateRenderException>()
            .Which;
        exception.Error.Should().Be(NotificationTemplateRenderError.UnknownPlaceholder);
        exception.PlaceholderName.Should().Be("unknown");
        exception.Message.Should().Contain("Placeholder {unknown} não permitido");
    }

    [Fact]
    public async Task MissingCustomTemplate_UsesCallerDefaultForPush()
    {
        var merchantId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        await using var context = new PrimaryDbContext(_options);
        await SeedMerchantAsync(context, merchantId, userId);

        var service = BuildService();
        await service.CreateWithTemplateAsync(
            merchantId,
            NotificationType.Payout,
            "Saque concluído",
            "Valor líquido enviado: R$ 100,00.",
            statusType: NotificationStatusType.PayoutCompleted,
            templateData: new Dictionary<string, string>
            {
                ["netAmount"] = "R$ 100,00",
                ["pixKey"] = "***1234"
            });

        _push.MerchantCalls.Should().ContainSingle();
        _push.MerchantCalls.Single().Title.Should().Be("Saque concluído");
        _push.MerchantCalls.Single().Body.Should().Be("Valor líquido enviado: R$ 100,00.");
    }

    [Fact]
    public async Task InAppNotification_IsCreatedWhenEveryDeliveryPreferenceIsDisabled()
    {
        var merchantId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        await using var context = new PrimaryDbContext(_options);
        await SeedMerchantAsync(context, merchantId, userId);
        context.UserNotificationPreferences.Add(new UserNotificationPreference
        {
            Id = Guid.CreateVersion7(),
            UserId = userId,
            PushNotificationsEnabled = false,
            InAppNotificationsEnabled = false,
            NotifyPaymentCompleted = false
        });
        await context.SaveChangesAsync();

        var service = BuildService();
        await service.CreateWithTemplateAsync(
            merchantId,
            NotificationType.Payment,
            "Venda aprovada",
            "Líquido recebido: R$ 10,00.",
            statusType: NotificationStatusType.PaymentCompleted);

        var inAppCount = await context.Notifications
            .CountAsync(notification => notification.MerchantId == merchantId);
        inAppCount.Should().Be(1);
        _push.MerchantCalls.Should().BeEmpty();
    }

    private NotificationService BuildService()
    {
        var services = new ServiceCollection();
        services.AddDbContext<PrimaryDbContext>(options =>
            options.UseNpgsql(_postgres.GetConnectionString()));
        services.AddSingleton<IPushNotificationService>(_push);
        var provider = services.BuildServiceProvider();
        return new NotificationService(
            provider.GetRequiredService<IServiceScopeFactory>(),
            NullLogger<NotificationService>.Instance);
    }

    private static async Task SeedMerchantAsync(
        PrimaryDbContext context,
        Guid merchantId,
        Guid userId)
    {
        context.Users.Add(new User
        {
            Id = userId,
            Email = $"user-{userId:N}@test.local",
            Name = "Test User",
            Password = "test-hash",
            CreatedAt = DateTime.UtcNow
        });
        context.Merchants.Add(new Merchant
        {
            Id = merchantId,
            UserId = userId,
            Name = "Merchant Teste",
            Status = MerchantStatus.Active,
            CreatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();
    }
}
