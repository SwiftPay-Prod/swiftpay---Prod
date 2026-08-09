using Google.Api.Gax;
using Google.Cloud.Firestore;
using Microsoft.Extensions.Options;
using swiftpay_api.Services.Internal.EmailOutbox;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Settings;
using swiftpay_api_core.Services;

namespace swiftpay_api.Extensions;

public static class EmailOutboxWorkerExtensions
{
    public static IServiceCollection AddEmailOutboxWorker(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        var platform = configuration.GetSection(EmailPlatformSettings.SectionName).Get<EmailPlatformSettings>() ?? new();
        var email = configuration.GetSection(EmailSettingsOptions.EmailSettings).Get<EmailSettingsOptions>();
        if (platform.Enabled && environment.IsProduction())
        {
            var missing = FindMissingConfiguration(platform, email, requireCredentialFile: true);
            if (missing.Count > 0)
                throw new InvalidOperationException($"Email outbox worker configuration is incomplete: {string.Join(", ", missing)}");
        }

        services.AddHealthChecks().AddCheck<EmailPlatformReadinessHealthCheck>(
            "email-platform-readiness",
            tags: ["ready", "email"]);
        services.AddScoped<IEmailTerminalSummaryStore, EmailTerminalSummaryStore>();

        if (!platform.Enabled)
        {
            services.AddSingleton<IEmailOutboxPublisher, DisabledEmailOutboxPublisher>();
            return services;
        }

        services.AddSingleton(_ => BuildFirestore(platform));
        services.AddSingleton<FirestoreEmailOutboxStore>();
        services.AddSingleton<IEmailOutboxPublisher>(provider => provider.GetRequiredService<FirestoreEmailOutboxStore>());
        services.AddSingleton<IEmailOutboxStore>(provider => provider.GetRequiredService<FirestoreEmailOutboxStore>());
        services.AddSingleton<IEmailOutboxStatusReader>(provider => provider.GetRequiredService<FirestoreEmailOutboxStore>());
        services.AddSingleton<IEmailOutboxWorkQueue, EmailOutboxWorkQueue>();
        services.AddSingleton<IEmailRetryBackoff, DeterministicEmailRetryBackoff>();
        services.AddSingleton<IEmailProviderTransport, ResendEmailProviderTransport>();
        services.AddSingleton(TimeProvider.System);
        services.AddSingleton<EmailOutboxCleanupProcessor>();
        services.AddHostedService<EmailOutboxWorkerService>();
        services.AddHostedService<EmailOutboxRecoveryService>();
        services.AddHostedService<EmailOutboxCleanupHostedService>();
        return services;
    }

    internal static List<string> FindMissingConfiguration(
        EmailPlatformSettings platform,
        EmailSettingsOptions? email,
        bool requireCredentialFile)
    {
        var missing = new List<string>();
        if (string.IsNullOrWhiteSpace(platform.FirebaseProjectId)) missing.Add("EmailPlatformSettings:FirebaseProjectId");
        if (email?.Resend is null || string.IsNullOrWhiteSpace(email.Resend.ApiKey)) missing.Add("EmailSettings:Resend:ApiKey");
        if (string.IsNullOrWhiteSpace(email?.FromEmail)) missing.Add("EmailSettings:FromEmail");
        if (string.IsNullOrWhiteSpace(email?.FromName)) missing.Add("EmailSettings:FromName");

        if (requireCredentialFile && string.IsNullOrWhiteSpace(platform.FirestoreEmulatorHost))
        {
            var credentialPath = Environment.GetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS");
            if (string.IsNullOrWhiteSpace(credentialPath)) missing.Add("GOOGLE_APPLICATION_CREDENTIALS");
            else if (!File.Exists(credentialPath)) missing.Add("GOOGLE_APPLICATION_CREDENTIALS file");
        }
        return missing;
    }

    private static FirestoreDb BuildFirestore(EmailPlatformSettings settings)
    {
        if (!string.IsNullOrWhiteSpace(settings.FirestoreEmulatorHost))
        {
            Environment.SetEnvironmentVariable("FIRESTORE_EMULATOR_HOST", settings.FirestoreEmulatorHost);
        }
        return new FirestoreDbBuilder
        {
            ProjectId = settings.FirebaseProjectId,
            EmulatorDetection = string.IsNullOrWhiteSpace(settings.FirestoreEmulatorHost)
                ? EmulatorDetection.EmulatorOrProduction
                : EmulatorDetection.EmulatorOnly
        }.Build();
    }

    private sealed class DisabledEmailOutboxPublisher : IEmailOutboxPublisher
    {
        public Task<EmailOutboxPublishResult> PublishAsync(EmailOutboxPublishRequest request, CancellationToken cancellationToken = default) =>
            throw new InvalidOperationException("Email outbox worker is disabled.");
    }
}
