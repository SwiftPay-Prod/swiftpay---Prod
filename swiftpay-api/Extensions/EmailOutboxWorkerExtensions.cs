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

        services.AddSingleton<IEmailProviderTransport, ResendEmailProviderTransport>();
        services.AddSingleton<IEmailOutboxPublisher, DirectResendEmailOutboxPublisher>();
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

        return missing;
    }
}
