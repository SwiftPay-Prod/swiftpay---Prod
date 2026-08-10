using System.Collections.Concurrent;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Settings;
using swiftpay_api_core.Services;
using Testcontainers.PostgreSql;

namespace swiftpay_api.Tests.Integration;

public sealed class EmailIntentRelayTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .Build();
    private DbContextOptions<PrimaryDbContext> _databaseOptions = null!;

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();
        _databaseOptions = new DbContextOptionsBuilder<PrimaryDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;
        await using var context = new PrimaryDbContext(_databaseOptions);
        await context.Database.EnsureCreatedAsync();
    }

    public Task DisposeAsync() => _postgres.DisposeAsync().AsTask();

    [Fact]
    public async Task TwoRelays_ShouldFreezeAndPublishOneAuthEnvelope()
    {
        var handle = await AddAuthIntentAsync();
        var links = new RecordingLinkGenerator();
        var publisher = new RecordingPublisher();
        var clock = new MutableTimeProvider(DateTimeOffset.UtcNow);

        await using var firstContext = new PrimaryDbContext(_databaseOptions);
        await using var secondContext = new PrimaryDbContext(_databaseOptions);
        var first = CreateProcessor(firstContext, links, publisher, clock);
        var second = CreateProcessor(secondContext, links, publisher, clock);

        await Task.WhenAll(first.ProcessBatchAsync(), second.ProcessBatchAsync());

        await using var verification = new PrimaryDbContext(_databaseOptions);
        var persisted = await verification.EmailIntents.SingleAsync(intent => intent.Id == handle.Id);
        persisted.State.Should().Be(EmailIntentState.Published);
        persisted.EnvelopeHash.Should().MatchRegex("^[0-9a-f]{64}$");
        links.CallCount.Should().Be(1);
        publisher.Envelopes.Should().ContainSingle();
    }

    [Fact]
    public async Task ExpiredMaterializationLease_ShouldRecoverAfterRestart()
    {
        var handle = await AddCustomIntentAsync();
        var now = DateTimeOffset.UtcNow;
        await using (var abandoned = new PrimaryDbContext(_databaseOptions))
        {
            var intent = await abandoned.EmailIntents.SingleAsync(item => item.Id == handle.Id);
            intent.State = EmailIntentState.Materializing;
            intent.MaterializationLeaseToken = "abandoned-fence";
            intent.MaterializationLeaseUntil = now.UtcDateTime.AddSeconds(-1);
            intent.MaterializationAttemptCount = 1;
            await abandoned.SaveChangesAsync();
        }

        await using var recovered = new PrimaryDbContext(_databaseOptions);
        var processor = CreateProcessor(
            recovered,
            new RecordingLinkGenerator(),
            new RecordingPublisher(),
            new MutableTimeProvider(now));
        await processor.ProcessBatchAsync();

        await using var verification = new PrimaryDbContext(_databaseOptions);
        (await verification.EmailIntents.SingleAsync(intent => intent.Id == handle.Id))
            .State.Should().Be(EmailIntentState.Published);
    }

    [Fact]
    public async Task FirestoreFailure_ShouldRemainRecoverableAcrossProcessorRestart()
    {
        var handle = await AddCustomIntentAsync();
        var clock = new MutableTimeProvider(DateTimeOffset.UtcNow);
        var publisher = new RecordingPublisher { FailuresRemaining = 1 };

        await using (var firstContext = new PrimaryDbContext(_databaseOptions))
        {
            await CreateProcessor(firstContext, new RecordingLinkGenerator(), publisher, clock)
                .ProcessBatchAsync();
        }

        DateTime retryAt;
        await using (var pendingContext = new PrimaryDbContext(_databaseOptions))
        {
            var pending = await pendingContext.EmailIntents.SingleAsync(intent => intent.Id == handle.Id);
            pending.State.Should().Be(EmailIntentState.PublishRetry);
            retryAt = pending.NextPublishAt!.Value;
        }

        clock.AdvanceTo(new DateTimeOffset(retryAt.AddSeconds(1), TimeSpan.Zero));
        await using (var restartedContext = new PrimaryDbContext(_databaseOptions))
        {
            await CreateProcessor(restartedContext, new RecordingLinkGenerator(), publisher, clock)
                .ProcessBatchAsync();
        }

        await using var verification = new PrimaryDbContext(_databaseOptions);
        (await verification.EmailIntents.SingleAsync(intent => intent.Id == handle.Id))
            .State.Should().Be(EmailIntentState.Published);
    }

    [Fact]
    public async Task DivergentOutboxHash_ShouldBecomePublishConflict()
    {
        var handle = await AddCustomIntentAsync();
        var publisher = new RecordingPublisher { ForceConflict = true };
        await using var context = new PrimaryDbContext(_databaseOptions);

        await CreateProcessor(
            context,
            new RecordingLinkGenerator(),
            publisher,
            new MutableTimeProvider(DateTimeOffset.UtcNow)).ProcessBatchAsync();

        await using var verification = new PrimaryDbContext(_databaseOptions);
        var persisted = await verification.EmailIntents.SingleAsync(intent => intent.Id == handle.Id);
        persisted.State.Should().Be(EmailIntentState.PublishConflict);
        persisted.LastErrorCode.Should().Be("EnvelopeHashConflict");
    }

    [Fact]
    public async Task AuthLink_ShouldOnlyBeGeneratedAfterPostgresCommit()
    {
        var links = new RecordingLinkGenerator();
        var publisher = new RecordingPublisher();
        var clock = new MutableTimeProvider(DateTimeOffset.UtcNow);
        EmailIntentHandle handle;

        await using var writingContext = new PrimaryDbContext(_databaseOptions);
        await using var transaction = await writingContext.Database.BeginTransactionAsync();
        var writer = new EmailIntentWriter(writingContext);
        handle = await writer.Add(CreateAuthRequest());
        await writingContext.SaveChangesAsync();

        await using (var beforeCommitContext = new PrimaryDbContext(_databaseOptions))
        {
            await CreateProcessor(beforeCommitContext, links, publisher, clock).ProcessBatchAsync();
        }
        links.CallCount.Should().Be(0);
        publisher.Envelopes.Should().BeEmpty();

        await transaction.CommitAsync();
        await using (var afterCommitContext = new PrimaryDbContext(_databaseOptions))
        {
            await CreateProcessor(afterCommitContext, links, publisher, clock).ProcessBatchAsync();
        }

        links.CallCount.Should().Be(1);
        await using var verification = new PrimaryDbContext(_databaseOptions);
        (await verification.EmailIntents.SingleAsync(intent => intent.Id == handle.Id))
            .State.Should().Be(EmailIntentState.Published);
    }

    private EmailIntentRelayProcessor CreateProcessor(
        PrimaryDbContext context,
        IPlatformAuthActionLinkGenerator links,
        IEmailOutboxPublisher publisher,
        TimeProvider clock)
    {
        var settings = Options.Create(new EmailPlatformSettings
        {
            Enabled = true,
            
            ContinueUrlAllowedHosts = ["swiftpayment.info"],
            RelayBatchSize = 10,
            RelayLeaseSeconds = 60,
            RelayRetryBaseSeconds = 1,
            RelayRetryMaximumSeconds = 1,
            RelayMaximumAttempts = 8
        });
        return new EmailIntentRelayProcessor(
            context,
            new EmailMessageTemplateCatalog(new MinimalTemplateProvider()),
            new EmailTemplateRenderer(),
            links,
            publisher,
            settings,
            clock,
            NullLogger<EmailIntentRelayProcessor>.Instance);
    }

    private async Task<EmailIntentHandle> AddAuthIntentAsync()
    {
        await using var context = new PrimaryDbContext(_databaseOptions);
        var handle = await new EmailIntentWriter(context).Add(CreateAuthRequest());
        await context.SaveChangesAsync();
        return handle;
    }

    private async Task<EmailIntentHandle> AddCustomIntentAsync()
    {
        await using var context = new PrimaryDbContext(_databaseOptions);
        var handle = await new EmailIntentWriter(context).Add(new EmailIntentAddRequest
        {
            Dedupe = EmailIntentDedupeKey.ManualOperation(EmailMessageType.CustomHtml, Guid.NewGuid()),
            MessageType = EmailMessageType.CustomHtml,
            RecipientAddress = "relay-custom@example.com",
            Owner = new EmailIntentOwner(EmailIntentOwnerType.Platform, Guid.NewGuid()),
            CorrelationId = Guid.NewGuid().ToString("N"),
            CustomHtml = new EmailIntentCustomHtmlRequest
            {
                Subject = "Mensagem SwiftPay",
                Body = TrustedEmailHtmlValue.FromTrustedSource("<p>Conteúdo seguro</p>", "Conteúdo seguro")
            }
        });
        await context.SaveChangesAsync();
        return handle;
    }

    private static EmailIntentAddRequest CreateAuthRequest()
    {
        var operation = Guid.NewGuid();
        return new EmailIntentAddRequest
        {
            Dedupe = EmailIntentDedupeKey.ManualOperation(EmailMessageType.EmailConfirmation, operation),
            MessageType = EmailMessageType.EmailConfirmation,
            RecipientAddress = "relay-auth@example.com",
            Owner = new EmailIntentOwner(EmailIntentOwnerType.User, Guid.NewGuid()),
            CorrelationId = operation.ToString("N"),
            Inputs = new Dictionary<string, string> { ["NAME"] = "Relay User" },
            AuthAction = new EmailIntentAuthActionRequest
            {
                ActionType = EmailAuthActionType.VerifyEmail,
                ContinueUrl = "https://swiftpayment.info/panel/verify-email"
            }
        };
    }

    private sealed class MinimalTemplateProvider : IEmailTemplateProvider
    {
        public Task<string> GetTemplateContentAsync(EmailTemplate template) => Task.FromResult(
            template == EmailTemplate.EmailConfirmation
                ? "<p>Olá, [[NAME]].</p><a href=\"[[CONFIRMATION_URL]]\">Confirmar</a><p>Expira em [[EXPIRES_IN]] horas.</p>"
                : throw new InvalidOperationException("Unexpected template."));
    }

    private sealed class RecordingLinkGenerator : IPlatformAuthActionLinkGenerator
    {
        private int _callCount;
        public int CallCount => _callCount;

        public Task<string> GenerateAsync(
            PlatformAuthActionLinkRequest request,
            CancellationToken cancellationToken = default)
        {
            var sequence = Interlocked.Increment(ref _callCount);
            return Task.FromResult(
                $"https://swiftpay-878c0.firebaseapp.com/__/auth/action?mode=verifyEmail&sequence={sequence}");
        }
    }

    private sealed class RecordingPublisher : IEmailOutboxPublisher
    {
        private int _failuresRemaining;
        public ConcurrentDictionary<Guid, EmailOutboxEnvelope> Envelopes { get; } = new();
        public int FailuresRemaining
        {
            get => _failuresRemaining;
            set => _failuresRemaining = value;
        }
        public bool ForceConflict { get; set; }

        public Task<EmailOutboxPublishResult> PublishAsync(
            EmailOutboxPublishRequest request,
            CancellationToken cancellationToken = default)
        {
            if (Interlocked.Decrement(ref _failuresRemaining) >= 0)
                throw new InvalidOperationException("Simulated Firestore outage.");
            if (ForceConflict)
            {
                return Task.FromResult(new EmailOutboxPublishResult(
                    request.Envelope.IntentId,
                    EmailOutboxPublishOutcome.Conflict,
                    EmailOutboxStatus.Queued));
            }

            var added = Envelopes.TryAdd(request.Envelope.IntentId, request.Envelope);
            var existing = Envelopes[request.Envelope.IntentId];
            var outcome = added
                ? EmailOutboxPublishOutcome.Created
                : existing.RequestHash == request.Envelope.RequestHash &&
                  existing.EnvelopeHash == request.Envelope.EnvelopeHash
                    ? EmailOutboxPublishOutcome.AlreadyPublished
                    : EmailOutboxPublishOutcome.Conflict;
            return Task.FromResult(new EmailOutboxPublishResult(
                request.Envelope.IntentId,
                outcome,
                EmailOutboxStatus.Queued));
        }
    }

    private sealed class MutableTimeProvider(DateTimeOffset now) : TimeProvider
    {
        private DateTimeOffset _now = now;
        public override DateTimeOffset GetUtcNow() => _now;
        public void AdvanceTo(DateTimeOffset value) => _now = value;
    }
}
