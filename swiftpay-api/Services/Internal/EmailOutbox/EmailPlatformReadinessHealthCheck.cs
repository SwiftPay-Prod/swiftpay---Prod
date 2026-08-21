using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using swiftpay_api.Extensions;
using swiftpay_api_core.Models.Settings;

namespace swiftpay_api.Services.Internal.EmailOutbox;

public sealed class EmailPlatformReadinessHealthCheck(
    IOptions<EmailPlatformSettings> platformOptions,
    IOptions<EmailSettingsOptions> emailOptions,
    IHostEnvironment environment) : IHealthCheck
{
    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var platform = platformOptions.Value;
        if (!platform.Enabled)
        {
            return Task.FromResult(HealthCheckResult.Healthy("Direct email provider (Resend) is active"));
        }

        var missing = EmailOutboxWorkerExtensions.FindMissingConfiguration(
            platform,
            emailOptions.Value,
            environment.IsProduction());
        return Task.FromResult(missing.Count == 0
            ? HealthCheckResult.Healthy("Email outbox worker configuration is ready")
            : HealthCheckResult.Unhealthy($"Email outbox worker configuration is incomplete: {string.Join(", ", missing)}"));
    }
}
