using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Services;
using Testcontainers.PostgreSql;

namespace swiftpay_api.Tests.Integration;

public sealed class EmailIntentPersistenceTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .Build();

    public Task InitializeAsync()
    {
        return _postgres.StartAsync();
    }

    public Task DisposeAsync()
    {
        return _postgres.DisposeAsync().AsTask();
    }

    [Fact]
    public async Task PersistedDedupe_ShouldReuseEqualPayloadAndRejectDivergentPayload()
    {
        var options = new DbContextOptionsBuilder<PrimaryDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;
        var request = CreateRequest();
        EmailIntentHandle firstHandle;

        await using (var firstContext = new PrimaryDbContext(options))
        {
            await firstContext.Database.EnsureCreatedAsync();
            var writer = new EmailIntentWriter(firstContext);
            firstHandle = await writer.Add(request);
            await firstContext.SaveChangesAsync();
        }

        await using (var equalContext = new PrimaryDbContext(options))
        {
            var writer = new EmailIntentWriter(equalContext);
            var reusedHandle = await writer.Add(request with { CorrelationId = "retry-correlation" });

            reusedHandle.Should().Be(firstHandle);
            equalContext.ChangeTracker.Entries<EmailIntent>()
                .Should().ContainSingle(entry => entry.State == EntityState.Unchanged);
        }

        await using (var divergentContext = new PrimaryDbContext(options))
        {
            var writer = new EmailIntentWriter(divergentContext);
            Func<Task> act = async () =>
            {
                await writer.Add(request with
                {
                    Inputs = new Dictionary<string, string> { ["merchantName"] = "Divergent Merchant" }
                });
            };

            await act.Should().ThrowAsync<EmailIntentConflictException>();
        }
    }
    [Fact]
    public async Task RolledBackSignup_ShouldPersistNeitherUserDeviceNorVerificationIntent()
    {
        var options = new DbContextOptionsBuilder<PrimaryDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;
        var userId = Guid.NewGuid();

        await using (var context = new PrimaryDbContext(options))
        {
            await context.Database.EnsureCreatedAsync();
            await using var transaction = await context.Database.BeginTransactionAsync();
            var user = new User
            {
                Id = userId,
                Name = "Atomic Signup",
                Email = "atomic-signup@example.com",
                Password = "not-used",
                FirebaseUid = "firebase-atomic-signup",
                FirebaseProvider = "password",
                ReferralCode = "ATOMIC123"
            };
            context.Users.Add(user);
            context.TrustedDevices.Add(new TrustedDevice
            {
                UserId = userId,
                DeviceId = "atomic-device",
                DeviceName = "Test Device",
                LastUsedAt = DateTime.UtcNow,
                IsActive = true
            });

            var writer = new EmailIntentWriter(context);
            await writer.Add(new EmailIntentAddRequest
            {
                Dedupe = EmailIntentDedupeKey.SignupVerification(user.FirebaseUid, "1"),
                MessageType = EmailMessageType.EmailConfirmation,
                RecipientAddress = user.Email,
                Owner = new EmailIntentOwner(EmailIntentOwnerType.User, userId),
                CorrelationId = "atomic-signup-test",
                Inputs = new Dictionary<string, string> { ["NAME"] = user.Name },
                AuthAction = new EmailIntentAuthActionRequest
                {
                    ActionType = EmailAuthActionType.VerifyEmail,
                    FirebaseUid = user.FirebaseUid,
                    ContinueUrl = "https://swiftpayment.info/?auth=signin"
                }
            });

            await context.SaveChangesAsync();
            await transaction.RollbackAsync();
        }

        await using var verificationContext = new PrimaryDbContext(options);
        (await verificationContext.Users.AnyAsync(user => user.Id == userId)).Should().BeFalse();
        (await verificationContext.TrustedDevices.AnyAsync(device => device.UserId == userId)).Should().BeFalse();
        (await verificationContext.EmailIntents.AnyAsync(intent => intent.OwnerId == userId)).Should().BeFalse();
    }
    [Fact]
    public async Task FailedPostgresBusinessSave_ShouldNotLeaveAnEmailIntent()
    {
        var options = new DbContextOptionsBuilder<PrimaryDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;
        var duplicateEmail = $"duplicate-{Guid.NewGuid():N}@example.com";

        await using (var seedContext = new PrimaryDbContext(options))
        {
            await seedContext.Database.EnsureCreatedAsync();
            seedContext.Users.Add(new User
            {
                Id = Guid.NewGuid(),
                Name = "Existing User",
                Email = duplicateEmail,
                Password = "not-used",
                ReferralCode = $"S{Guid.NewGuid():N}"[..12]
            });
            await seedContext.SaveChangesAsync();
        }

        EmailIntentHandle emailHandle;
        await using (var failingContext = new PrimaryDbContext(options))
        {
            failingContext.Users.Add(new User
            {
                Id = Guid.NewGuid(),
                Name = "Conflicting User",
                Email = duplicateEmail,
                Password = "not-used",
                ReferralCode = $"F{Guid.NewGuid():N}"[..12]
            });
            var writer = new EmailIntentWriter(failingContext);
            emailHandle = await writer.Add(CreateRequest() with
            {
                Dedupe = EmailIntentDedupeKey.BusinessTransition(
                    EmailMessageType.KycSubmitted,
                    Guid.NewGuid(),
                    Guid.NewGuid())
            });

            Func<Task> save = () => failingContext.SaveChangesAsync();
            await save.Should().ThrowAsync<DbUpdateException>();
        }

        await using var verificationContext = new PrimaryDbContext(options);
        (await verificationContext.EmailIntents.AnyAsync(intent => intent.Id == emailHandle.Id))
            .Should().BeFalse();
    }

    private static EmailIntentAddRequest CreateRequest()
    {
        return new EmailIntentAddRequest
        {
            Dedupe = EmailIntentDedupeKey.BusinessTransition(
                EmailMessageType.KycSubmitted,
                Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Guid.Parse("22222222-2222-2222-2222-222222222222")),
            MessageType = EmailMessageType.KycSubmitted,
            RecipientAddress = "integration@example.com",
            Owner = new EmailIntentOwner(
                EmailIntentOwnerType.Merchant,
                Guid.Parse("33333333-3333-3333-3333-333333333333")),
            CorrelationId = "integration-correlation",
            Inputs = new Dictionary<string, string>
            {
                ["merchantName"] = "Integration Merchant"
            }
        };
    }
}
