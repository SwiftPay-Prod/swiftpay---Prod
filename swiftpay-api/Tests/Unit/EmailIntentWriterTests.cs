using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Services;
using Testcontainers.PostgreSql;

namespace swiftpay_api.Tests.Unit;

public sealed class EmailIntentWriterTests : IAsyncLifetime
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
        await using var context = new PrimaryDbContext(_options);
        await context.Database.EnsureCreatedAsync();
    }

    public Task DisposeAsync() => _postgres.DisposeAsync().AsTask();

    [Fact]
    public async Task Add_ShouldProduceCanonicalRequestHash()
    {
        var dedupe = EmailIntentDedupeKey.BusinessTransition(
            EmailMessageType.KycSubmitted,
            Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"));

        EmailIntent first;
        EmailIntent second;
        await using (var firstContext = new PrimaryDbContext(_options))
        {
            var firstWriter = new EmailIntentWriter(firstContext);
            await firstWriter.Add(CreateRequest(
                dedupe,
                " OWNER@Example.COM ",
                new Dictionary<string, string>
                {
                    ["zeta"] = "last",
                    ["alpha"] = "first"
                }));
            await firstContext.SaveChangesAsync();
            first = await firstContext.EmailIntents.SingleAsync();
        }

        await using (var secondContext = new PrimaryDbContext(_options))
        {
            var secondWriter = new EmailIntentWriter(secondContext);
            await secondWriter.Add(CreateRequest(
                dedupe,
                "owner@example.com",
                new Dictionary<string, string>
                {
                    ["alpha"] = "first",
                    ["zeta"] = "last"
                }));
            await secondContext.SaveChangesAsync();
            second = await secondContext.EmailIntents.SingleAsync();
        }

        first.RequestHash.Should().Be(second.RequestHash);
        first.RequestPayloadJson.Should().Be(second.RequestPayloadJson);
        first.RequestPayloadJson.IndexOf("alpha", StringComparison.Ordinal)
            .Should().BeLessThan(first.RequestPayloadJson.IndexOf("zeta", StringComparison.Ordinal));
        first.RecipientAddress.Should().Be("owner@example.com");
    }

    [Fact]
    public async Task Add_ShouldReuseOneTrackedIntentForEqualDedupeAndPayload()
    {
        await using var context = new PrimaryDbContext(_options);
        var writer = new EmailIntentWriter(context);
        var request = CreateRequest();

        var first = await writer.Add(request);
        var second = await writer.Add(request with { CorrelationId = "retry-correlation" });

        second.Should().Be(first);
        context.ChangeTracker.Entries<EmailIntent>().Should().ContainSingle();
        context.ChangeTracker.Entries<EmailIntent>().Single().State.Should().Be(EntityState.Added);
    }

    [Fact]
    public async Task Add_ShouldRejectEqualDedupeWithDivergentPayload()
    {
        await using var context = new PrimaryDbContext(_options);
        var writer = new EmailIntentWriter(context);
        var request = CreateRequest();
        await writer.Add(request);

        Func<Task> act = async () =>
        {
            await writer.Add(request with
            {
                Inputs = new Dictionary<string, string> { ["merchantName"] = "Different Merchant" }
            });
        };

        await act.Should().ThrowAsync<EmailIntentConflictException>();
        context.ChangeTracker.Entries<EmailIntent>().Should().ContainSingle();
    }

    [Fact]
    public async Task Add_ShouldAttachWithoutCallingSaveChanges()
    {
        var options = new DbContextOptionsBuilder<PrimaryDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;
        await using var context = new SaveTrackingDbContext(options);
        var writer = new EmailIntentWriter(context);

        var handle = await writer.Add(CreateRequest());

        handle.Id.Should().NotBeEmpty();
        context.SaveCallCount.Should().Be(0);
        context.Entry(context.EmailIntents.Local.Single()).State.Should().Be(EntityState.Added);
    }

    [Fact]
    public async Task TerminalSummary_ShouldBeOwnerScopedAndContainNoRecipientOrPayload()
    {
        await using var context = new PrimaryDbContext(_options);
        var writer = new EmailIntentWriter(context);
        var request = CreateRequest();
        var handle = await writer.Add(request);
        var intent = context.EmailIntents.Local.Single();
        var occurredAt = new DateTime(2026, 8, 8, 13, 0, 0, DateTimeKind.Utc);
        var recordedAt = occurredAt.AddMinutes(1);

        intent.RecordTerminalSummary(
            EmailDeliveryTerminalStatus.Failed,
            "Provider.PermanentRejection",
            occurredAt,
            providerAcceptedAt: null,
            recordedAt);

        intent.GetTerminalSummary(new EmailIntentOwner(EmailIntentOwnerType.User, Guid.NewGuid()))
            .Should().BeNull();
        var summary = intent.GetTerminalSummary(request.Owner);
        summary.Should().NotBeNull();
        summary!.Value.MessageId.Should().Be(handle.Id);
        summary.Value.Status.Should().Be(EmailDeliveryTerminalStatus.Failed);
        summary.Value.SafeErrorCode.Should().Be("Provider.PermanentRejection");

        var serialized = JsonSerializer.Serialize(summary.Value);
        serialized.Should().NotContain("owner@example.com");
        serialized.Should().NotContain("Merchant One");
        serialized.ToLowerInvariant().Should().NotContain("recipient");
        serialized.ToLowerInvariant().Should().NotContain("payload");
    }

    [Fact]
    public async Task MaterializedEnvelope_ShouldHashCanonicalRecipientAndRemainImmutable()
    {
        await using var context = new PrimaryDbContext(_options);
        var writer = new EmailIntentWriter(context);
        await writer.Add(CreateRequest());
        var intent = context.EmailIntents.Local.Single();
        var materializedAt = new DateTime(2026, 8, 8, 12, 0, 0, DateTimeKind.Utc);
        var sendBefore = materializedAt.AddMinutes(30);
        var envelope = new EmailEnvelopeHashInput
        {
            RecipientAddress = "OWNER@example.com",
            Subject = "KYC submitted",
            HtmlBody = "<p>Submitted</p>",
            TextBody = "Submitted",
            SendBefore = sendBefore
        };

        var firstHash = intent.RecordMaterializedEnvelope(envelope, materializedAt);
        var secondHash = intent.RecordMaterializedEnvelope(
            envelope with { RecipientAddress = "owner@example.com" },
            materializedAt.AddSeconds(1));

        secondHash.Should().Be(firstHash);
        intent.RequestHash.Should().NotBe(firstHash);
        intent.State.Should().Be(EmailIntentState.ReadyToPublish);
        Action mutate = () => intent.RecordMaterializedEnvelope(
            envelope with { Subject = "Changed" },
            materializedAt.AddSeconds(2));
        mutate.Should().Throw<InvalidOperationException>();
    }

    private static PrimaryDbContext CreateContext(DbContextOptions<PrimaryDbContext> options) =>
        new(options);

    private static EmailIntentAddRequest CreateRequest(
        EmailIntentDedupeKey? dedupe = null,
        string recipient = "owner@example.com",
        IReadOnlyDictionary<string, string>? inputs = null)
    {
        var owner = new EmailIntentOwner(EmailIntentOwnerType.User, Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"));
        return new EmailIntentAddRequest
        {
            Dedupe = dedupe ?? EmailIntentDedupeKey.BusinessTransition(
                EmailMessageType.KycSubmitted,
                owner.Id,
                Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd")),
            MessageType = EmailMessageType.KycSubmitted,
            RecipientAddress = recipient,
            Owner = owner,
            CorrelationId = "test-correlation",
            Inputs = inputs ?? new Dictionary<string, string>
            {
                ["merchantName"] = "Merchant One"
            }
        };
    }

    private sealed class SaveTrackingDbContext(DbContextOptions<PrimaryDbContext> options)
        : PrimaryDbContext(options)
    {
        public int SaveCallCount { get; private set; }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            SaveCallCount++;
            return base.SaveChangesAsync(cancellationToken);
        }
    }
}