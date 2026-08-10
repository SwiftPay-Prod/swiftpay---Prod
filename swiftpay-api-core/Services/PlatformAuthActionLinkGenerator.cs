using Microsoft.Extensions.Options;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Settings;

namespace swiftpay_api_core.Services;

public sealed class PlatformAuthActionLinkGenerator : IPlatformAuthActionLinkGenerator
{
    private readonly PlatformSettingsOptions _platformSettings;
    private readonly EmailPlatformSettings _emailPlatformSettings;

    public PlatformAuthActionLinkGenerator(
        IOptions<PlatformSettingsOptions> platformSettings,
        IOptions<EmailPlatformSettings> emailPlatformSettings)
    {
        _platformSettings = platformSettings.Value;
        _emailPlatformSettings = emailPlatformSettings.Value;
    }

    public Task<string> GenerateAsync(
        EmailAuthActionLinkRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        cancellationToken.ThrowIfCancellationRequested();

        var continueUrl = ValidateContinueUrl(request.ContinueUrl);
        _ = continueUrl;

        var baseUrl = _platformSettings.BaseUrl.TrimEnd('/');
        var link = request.ActionType switch
        {
            EmailAuthActionType.VerifyEmail => $"{baseUrl}/verify-email?email={Uri.EscapeDataString(request.RecipientAddress)}",
            EmailAuthActionType.PasswordReset => $"{baseUrl}/?auth=forgot-password&email={Uri.EscapeDataString(request.RecipientAddress)}",
            EmailAuthActionType.EmailSignIn => $"{baseUrl}/?auth=signin&email={Uri.EscapeDataString(request.RecipientAddress)}",
            _ => throw new EmailIntentValidationException("The auth action type is not supported.")
        };

        return Task.FromResult(link);
    }

    private string ValidateContinueUrl(string candidate)
    {
        if (string.IsNullOrWhiteSpace(candidate))
            throw new EmailIntentValidationException("The continue URL is required.");

        if (!Uri.TryCreate(candidate.Trim(), UriKind.Absolute, out var uri) ||
            !string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase) ||
            string.IsNullOrWhiteSpace(uri.Host) ||
            !string.IsNullOrEmpty(uri.UserInfo) ||
            !uri.IsDefaultPort)
        {
            throw new EmailIntentValidationException(
                "The continue URL must be an absolute HTTPS URL without credentials or a custom port.");
        }

        var allowed = _emailPlatformSettings.ContinueUrlAllowedHosts.Any(host =>
            string.Equals(NormalizeHost(host), uri.IdnHost, StringComparison.OrdinalIgnoreCase));
        if (!allowed)
            throw new EmailIntentValidationException("The auth action continue URL host is not allowlisted.");

        return new UriBuilder(uri)
        {
            Scheme = Uri.UriSchemeHttps,
            Host = uri.IdnHost.ToLowerInvariant(),
            Port = -1
        }.Uri.AbsoluteUri;
    }

    private static string NormalizeHost(string host)
    {
        if (string.IsNullOrWhiteSpace(host) ||
            host.Contains('/', StringComparison.Ordinal) ||
            host.Contains(':', StringComparison.Ordinal) ||
            host.Contains('*', StringComparison.Ordinal))
        {
            throw new EmailIntentValidationException("The auth action continue URL allowlist contains an invalid host.");
        }

        return new UriBuilder(Uri.UriSchemeHttps, host.Trim()).Uri.IdnHost;
    }
}