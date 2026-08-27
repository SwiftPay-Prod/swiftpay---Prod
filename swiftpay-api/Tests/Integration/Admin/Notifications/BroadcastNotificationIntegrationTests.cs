using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api.Endpoints.Admin.Notifications.BroadcastNotification;
using swiftpay_api_core.Database;
using swiftpay_api_core.Services;
using Testcontainers.PostgreSql;

namespace swiftpay_api.Tests.Integration.Admin.Notifications;

public sealed class BroadcastNotificationIntegrationTests
    : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .WithDatabase("swiftpay")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    private PrimaryDbContext DbContext { get; set; } = null!;

    public async Task InitializeAsync()
    {
        await _container.StartAsync();
        var options = new DbContextOptionsBuilder<PrimaryDbContext>()
            .UseNpgsql(_container.GetConnectionString())
            .Options;

        DbContext = new PrimaryDbContext(options);
        await DbContext.Database.MigrateAsync();
    }

    public async Task DisposeAsync()
    {
        await DbContext.DisposeAsync();
        await _container.DisposeAsync();
    }

    [Fact]
    public async Task Broadcast_All_Should_CreateAuditAndEnqueueNotifications()
    {
        // Arrange
        var userId = Guid.CreateVersion7();
        var user = new User
        {
            Id = userId,
            Email = "user@example.com",
            Name = "User Test"
        };

        DbContext.Users.Add(user);
        await DbContext.SaveChangesAsync();

        var notificationServiceMock = new Mock<INotificationService>();
        var endpoint = new BroadcastNotificationEndpoint(
            DbContext,
            notificationServiceMock.Object);

        var request = new BroadcastNotificationRequest
        {
            Audience = "all",
            Title = "Broadcast Test",
            Body = "Body Test",
            ActionUrl = "https://example.com",
            Priority = NotificationPriority.Normal
        };

        var httpContext = new DefaultHttpContext();
        httpContext.User = new System.Security.Claims.ClaimsPrincipal(
            new System.Security.Claims.ClaimsIdentity(new[]
            {
                new System.Security.Claims.Claim("sub", userId.ToString())
            }, "Test"));

        endpoint.HttpContext = httpContext;

        // Act
        await endpoint.HandleAsync(request, CancellationToken.None);

        // Assert
        var response = httpContext.Response;
        response.StatusCode.Should().Be(200);

        var audits = await DbContext.BroadcastAudits.ToListAsync();
        audits.Should().ContainSingle();
        audits.Single().Title.Should().Be("Broadcast Test");
        audits.Single().Processed.Should().Be(1);
        audits.Single().Success.Should().Be(1);
    }
}
