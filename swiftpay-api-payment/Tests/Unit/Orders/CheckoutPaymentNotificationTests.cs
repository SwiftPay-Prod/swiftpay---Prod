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
using swiftpay_api_payment.Interfaces.Transactions;
using swiftpay_api_payment.Models.Orders;
using swiftpay_api_payment.Services;
using swiftpay_api_payment.Services.Transactions;
using Testcontainers.PostgreSql;

namespace swiftpay_api_payment.Tests.Unit.Orders;

public sealed class CheckoutRecordingPushService : IPushNotificationService
{
    public List<(Guid MerchantId, string Title, string Body, Dictionary<string, string>? Data)> MerchantCalls { get; } = [];
    public List<(Guid UserId, string Title, string Body, Dictionary<string, string>? Data)> UserCalls { get; } = [];

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

public sealed class CheckoutPaymentNotificationTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .Build();

    private readonly CheckoutRecordingPushService _push = new();
    private DbContextOptions<PrimaryDbContext> _options = null!;
    private ServiceProvider _notificationProvider = null!;
    private NotificationService _notificationService = null!;

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();
        _options = new DbContextOptionsBuilder<PrimaryDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;

        await using (var context = new PrimaryDbContext(_options))
        {
            await context.Database.EnsureCreatedAsync();
        }

        var services = new ServiceCollection();
        services.AddDbContext<PrimaryDbContext>(options => options.UseNpgsql(_postgres.GetConnectionString()));
        services.AddSingleton<IPushNotificationService>(_push);
        _notificationProvider = services.BuildServiceProvider();
        _notificationService = new NotificationService(
            _notificationProvider.GetRequiredService<IServiceScopeFactory>(),
            NullLogger<NotificationService>.Instance);
    }

    public async Task DisposeAsync()
    {
        await _notificationProvider.DisposeAsync();
        await _postgres.DisposeAsync();
    }

    [Fact]
    public async Task CheckoutPix_WithPaymentPendingEnabled_SendsPushWithTransactionUrlAndCreatesInApp()
    {
        await using var context = new PrimaryDbContext(_options);
        var scenario = await SeedCheckoutAsync(context, pushEnabled: true, paymentPendingEnabled: true);
        var service = BuildOrderService(context, _notificationService, scenario);

        var result = await service.CreateFromCheckoutAsync(CreateInput(scenario));

        result.Success.Should().BeTrue();
        result.Payment.Should().NotBeNull();
        _push.MerchantCalls.Should().ContainSingle();
        _push.MerchantCalls[0].MerchantId.Should().Be(scenario.MerchantId);
        _push.MerchantCalls[0].Data.Should().ContainKey("actionUrl")
            .WhoseValue.Should().Be(NotificationTemplates.Routes.Transactions);

        await using var verifyContext = new PrimaryDbContext(_options);
        var notification = await verifyContext.Notifications
            .AsNoTracking()
            .SingleAsync(item => item.MerchantId == scenario.MerchantId);
        notification.StatusType.Should().Be(NotificationStatusType.PaymentPending);
        notification.ActionUrl.Should().Be(NotificationTemplates.Routes.Transactions);

        var payment = await verifyContext.Payments
            .AsNoTracking()
            .SingleAsync(item => item.Id == result.Payment!.Id);
        payment.OrderId.Should().NotBeNull();
        payment.RequestSource.Should().Be(PaymentRequestSource.Checkout);
    }

    [Theory]
    [InlineData(false, true)]
    [InlineData(true, false)]
    public async Task CheckoutPix_WithPushOrPaymentPendingDisabled_DoesNotPushButCreatesInApp(
        bool pushEnabled,
        bool paymentPendingEnabled)
    {
        await using var context = new PrimaryDbContext(_options);
        var scenario = await SeedCheckoutAsync(context, pushEnabled, paymentPendingEnabled);
        var service = BuildOrderService(context, _notificationService, scenario);

        var result = await service.CreateFromCheckoutAsync(CreateInput(scenario));

        result.Success.Should().BeTrue();
        _push.MerchantCalls.Should().BeEmpty();
        _push.UserCalls.Should().BeEmpty();

        await using var verifyContext = new PrimaryDbContext(_options);
        var notification = await verifyContext.Notifications
            .AsNoTracking()
            .SingleAsync(item => item.MerchantId == scenario.MerchantId);
        notification.StatusType.Should().Be(NotificationStatusType.PaymentPending);
        notification.ActionUrl.Should().Be(NotificationTemplates.Routes.Transactions);
    }

    [Fact]
    public async Task CheckoutPix_NotifiesExactlyOnceAfterPaymentAndOrderLinkArePersisted()
    {
        await using var context = new PrimaryDbContext(_options);
        var scenario = await SeedCheckoutAsync(context, pushEnabled: true, paymentPendingEnabled: true);
        var probe = new PersistedPaymentNotificationProbe(_options);
        var service = BuildOrderService(context, probe, scenario);

        var result = await service.CreateFromCheckoutAsync(CreateInput(scenario));

        result.Success.Should().BeTrue();
        probe.PaymentCalls.Should().ContainSingle();
        probe.PaymentCalls[0].PaymentPersistedWithOrder.Should().BeTrue();
        probe.PaymentCalls[0].StatusType.Should().Be(NotificationStatusType.PaymentPending);
        probe.PaymentCalls[0].ActionUrl.Should().Be(NotificationTemplates.Routes.Transactions);
    }

    private static OrderService BuildOrderService(
        PrimaryDbContext context,
        INotificationService notificationService,
        CheckoutScenario scenario)
    {
        var paymentService = new PersistingPixPaymentMethodService(
            context,
            scenario.MerchantAcquirerId,
            scenario.AcquirerId);
        var factory = new CheckoutPaymentMethodServiceFactory(paymentService);

        return new OrderService(
            context,
            factory,
            new CheckoutNoOpMessagePublisher(),
            notificationService,
            NullLogger<OrderService>.Instance);
    }

    private static CreateOrderInput CreateInput(CheckoutScenario scenario) => new()
    {
        MerchantId = scenario.MerchantId,
        CustomerId = scenario.CustomerId,
        CheckoutId = scenario.CheckoutId,
        Environment = ApiEnvironment.Production,
        Items =
        [
            new CreateOrderItemInput
            {
                ProductId = scenario.ProductId,
                Quantity = 1,
                UnitPrice = 10_000
            }
        ],
        PaymentMethod = PaymentMethod.Pix,
        Description = "Checkout PIX Teste"
    };

    private static async Task<CheckoutScenario> SeedCheckoutAsync(
        PrimaryDbContext context,
        bool pushEnabled,
        bool paymentPendingEnabled)
    {
        var now = DateTime.UtcNow;
        var scenario = new CheckoutScenario(
            Guid.CreateVersion7(),
            Guid.CreateVersion7(),
            Guid.CreateVersion7(),
            Guid.CreateVersion7(),
            Guid.CreateVersion7(),
            Guid.CreateVersion7(),
            Guid.CreateVersion7());

        context.Users.Add(new User
        {
            Id = scenario.UserId,
            Name = "Checkout Notification User",
            Email = $"checkout-{scenario.UserId:N}@test.local",
            Password = "test-hash",
            Role = UserRole.Merchant,
            Status = UserStatus.Active,
            CreatedAt = now,
            UpdatedAt = now
        });
        context.Merchants.Add(new Merchant
        {
            Id = scenario.MerchantId,
            UserId = scenario.UserId,
            Name = "Checkout Notification Merchant",
            Email = $"merchant-{scenario.MerchantId:N}@test.local",
            Status = MerchantStatus.Active,
            KycStatus = MerchantKycStatus.Approved,
            CreatedAt = now,
            UpdatedAt = now
        });
        context.Acquirers.Add(new Acquirer
        {
            Id = scenario.AcquirerId,
            Name = "Checkout Test Acquirer",
            Code = $"checkout-{scenario.AcquirerId:N}",
            Type = AcquirerType.Bankizi,
            IsActive = true,
            SupportsPix = true,
            PixEnabled = true,
            CreatedAt = now,
            UpdatedAt = now
        });
        context.MerchantAcquirers.Add(new MerchantAcquirer
        {
            Id = scenario.MerchantAcquirerId,
            MerchantId = scenario.MerchantId,
            AcquirerId = scenario.AcquirerId,
            IsActive = true,
            IsDefault = true,
            CreatedAt = now,
            UpdatedAt = now
        });
        context.Customers.Add(new Customer
        {
            Id = scenario.CustomerId,
            MerchantId = scenario.MerchantId,
            Name = "Cliente Checkout",
            Email = $"customer-{scenario.CustomerId:N}@test.local",
            Status = CustomerStatus.Active,
            Environment = ApiEnvironment.Production,
            CreatedAt = now,
            UpdatedAt = now
        });
        context.Products.Add(new Product
        {
            Id = scenario.ProductId,
            MerchantId = scenario.MerchantId,
            Name = "Produto Checkout",
            Type = ProductType.Physical,
            Price = 10_000,
            Status = ProductStatus.Active,
            Environment = ApiEnvironment.Production,
            CreatedAt = now,
            UpdatedAt = now
        });
        context.Checkouts.Add(new Checkout
        {
            Id = scenario.CheckoutId,
            MerchantId = scenario.MerchantId,
            Name = "Checkout PIX",
            Slug = $"checkout-{scenario.CheckoutId:N}",
            ShortId = scenario.CheckoutId.ToString("N")[..12],
            Status = CheckoutStatus.Active,
            Environment = ApiEnvironment.Production,
            CreatedAt = now,
            UpdatedAt = now
        });
        context.UserNotificationPreferences.Add(new UserNotificationPreference
        {
            Id = Guid.CreateVersion7(),
            UserId = scenario.UserId,
            PushNotificationsEnabled = pushEnabled,
            InAppNotificationsEnabled = false,
            NotifyPaymentPending = paymentPendingEnabled,
            CreatedAt = now,
            UpdatedAt = now
        });

        await context.SaveChangesAsync();
        return scenario;
    }

    private sealed record CheckoutScenario(
        Guid UserId,
        Guid MerchantId,
        Guid AcquirerId,
        Guid MerchantAcquirerId,
        Guid CustomerId,
        Guid ProductId,
        Guid CheckoutId);

    private sealed class PersistingPixPaymentMethodService(
        PrimaryDbContext context,
        Guid merchantAcquirerId,
        Guid acquirerId) : IPaymentMethodService
    {
        public PaymentMethod Method => PaymentMethod.Pix;

        public async Task<PaymentMethodResult> CreateAsync(PaymentMethodInput input, CancellationToken ct = default)
        {
            var now = DateTime.UtcNow;
            var payment = new Payment
            {
                Id = Guid.CreateVersion7(),
                MerchantId = input.MerchantId,
                MerchantAcquirerId = merchantAcquirerId,
                CustomerId = input.CustomerId,
                AcquirerId = acquirerId,
                Amount = input.Amount,
                PlatformFee = 100,
                CheckoutTemplateFee = 0,
                AcquirerFee = 50,
                NetAmount = input.Amount - 100,
                MerchantSettlementAmount = input.Amount - 100,
                AcquirerNetAmount = input.Amount - 50,
                Currency = CurrencyType.BRL,
                Method = PaymentMethod.Pix,
                Status = PaymentStatus.Pending,
                Description = input.Description,
                Environment = input.Environment,
                RequestOrigin = input.RequestOrigin,
                RequestSource = input.RequestSource,
                SuppressWebhookAndNotification = false,
                CreatedAt = now,
                UpdatedAt = now
            };
            var pix = new PaymentPix
            {
                Id = Guid.CreateVersion7(),
                PaymentId = payment.Id,
                TxId = $"checkout-{Guid.NewGuid():N}",
                QrCode = "checkout-qr",
                CopyAndPaste = "checkout-pix-copy-and-paste",
                ExpiresAt = now.AddMinutes(30),
                CreatedAt = now,
                UpdatedAt = now
            };

            context.Payments.Add(payment);
            context.PaymentsPix.Add(pix);
            await context.SaveChangesAsync(ct);
            payment.PaymentPix = pix;

            return new PaymentMethodResult
            {
                Success = true,
                Payment = payment,
                PaymentPix = pix
            };
        }
    }

    private sealed class CheckoutPaymentMethodServiceFactory(IPaymentMethodService paymentService)
        : IPaymentMethodServiceFactory
    {
        public IPaymentMethodService? GetService(PaymentMethod method)
            => method == paymentService.Method ? paymentService : null;

        public IEnumerable<PaymentMethod> GetAvailableMethods() => [paymentService.Method];
    }

    private sealed class CheckoutNoOpMessagePublisher : IMessagePublisher
    {
        public bool IsEnabled => false;

        public Task PublishAsync<T>(string queue, T message, CancellationToken ct = default) where T : class
            => Task.CompletedTask;
    }

    private sealed class PersistedPaymentNotificationProbe(DbContextOptions<PrimaryDbContext> options)
        : INotificationService
    {
        public List<(bool PaymentPersistedWithOrder, NotificationStatusType StatusType, string? ActionUrl)> PaymentCalls { get; } = [];

        public Task CreatePaymentNotificationAsync(
            Guid merchantId,
            string title,
            string message,
            NotificationStatusType statusType,
            ApiEnvironment environment,
            string? actionUrl = null)
        {
            using var context = new PrimaryDbContext(options);
            var paymentPersistedWithOrder = context.Payments
                .AsNoTracking()
                .Any(payment => payment.MerchantId == merchantId && payment.OrderId != null);
            PaymentCalls.Add((paymentPersistedWithOrder, statusType, actionUrl));
            return Task.CompletedTask;
        }

        public Task CreateAsync(Guid merchantId, NotificationType type, string title, string message, NotificationPriority priority = NotificationPriority.Normal, string? actionUrl = null, string? actionLabel = null, bool requiresMerchantRefresh = false, ApiEnvironment environment = ApiEnvironment.Production, NotificationStatusType? statusType = null) => Task.CompletedTask;
        public Task CreateWithTemplateAsync(Guid merchantId, NotificationType type, string title, string message, NotificationPriority priority = NotificationPriority.Normal, string? actionUrl = null, string? actionLabel = null, bool requiresMerchantRefresh = false, ApiEnvironment environment = ApiEnvironment.Production, NotificationStatusType? statusType = null, IReadOnlyDictionary<string, string>? templateData = null) => Task.CompletedTask;
        public Task CreateAsync(Guid merchantId, NotificationType type, string title, string message, ApiEnvironment environment) => Task.CompletedTask;
        public Task CreateSecurityNotificationAsync(Guid merchantId, string title, string message, NotificationPriority priority = NotificationPriority.High, bool requiresMerchantRefresh = false) => Task.CompletedTask;
        public Task CreatePayoutNotificationAsync(Guid merchantId, string title, string message, NotificationStatusType statusType, ApiEnvironment environment, string? actionUrl = null) => Task.CompletedTask;
        public Task CreateChargebackNotificationAsync(Guid merchantId, string title, string message, ApiEnvironment environment, string? actionUrl = null) => Task.CompletedTask;
        public Task CreateSystemNotificationAsync(Guid merchantId, string title, string message, NotificationPriority priority = NotificationPriority.Normal) => Task.CompletedTask;
        public Task CreateSuccessNotificationAsync(Guid merchantId, string title, string message, string? actionUrl = null, string? actionLabel = null, bool requiresMerchantRefresh = false) => Task.CompletedTask;
        public Task CreateWarningNotificationAsync(Guid merchantId, string title, string message, NotificationPriority priority = NotificationPriority.Normal, bool requiresMerchantRefresh = false) => Task.CompletedTask;
        public Task CreateErrorNotificationAsync(Guid merchantId, string title, string message, NotificationPriority priority = NotificationPriority.High) => Task.CompletedTask;
        public Task CreateInfoNotificationAsync(Guid merchantId, string title, string message, NotificationPriority priority = NotificationPriority.Normal, string? actionUrl = null, string? actionLabel = null, bool requiresMerchantRefresh = false) => Task.CompletedTask;
        public Task CreateUserNotificationAsync(Guid userId, NotificationType type, string title, string message, NotificationPriority priority = NotificationPriority.Normal, string? actionUrl = null, string? actionLabel = null) => Task.CompletedTask;
        public Task CreateUserSecurityNotificationAsync(Guid userId, string title, string message, NotificationPriority priority = NotificationPriority.High, string? actionUrl = null) => Task.CompletedTask;
        public Task CreateUserInfoNotificationAsync(Guid userId, string title, string message, NotificationPriority priority = NotificationPriority.Normal, string? actionUrl = null, string? actionLabel = null) => Task.CompletedTask;
    }
}
