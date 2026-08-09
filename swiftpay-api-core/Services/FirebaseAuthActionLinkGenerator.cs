using FirebaseAdmin;
using FirebaseAdmin.Auth;
using Google.Apis.Auth.OAuth2;
using Microsoft.Extensions.Options;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Settings;

namespace swiftpay_api_core.Services;

public sealed class FirebaseAuthActionLinkGenerator : IFirebaseAuthActionLinkGenerator
{
    private const string FirebaseAppName = "swiftpay-email-platform";
    private readonly EmailPlatformSettings _settings;
    private readonly Lazy<FirebaseAuth> _auth;

    public FirebaseAuthActionLinkGenerator(IOptions<EmailPlatformSettings> settings)
    {
        _settings = settings.Value;
        _auth = new Lazy<FirebaseAuth>(CreateFirebaseAuth, LazyThreadSafetyMode.ExecutionAndPublication);
    }

    public async Task<string> GenerateAsync(
        EmailAuthActionLinkRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        cancellationToken.ThrowIfCancellationRequested();

        var continueUrl = ValidateContinueUrl(request.ContinueUrl);
        var actionSettings = new ActionCodeSettings
        {
            Url = continueUrl,
            HandleCodeInApp = request.ActionType == EmailAuthActionType.EmailSignIn
        };

        var link = request.ActionType switch
        {
            EmailAuthActionType.VerifyEmail =>
                await _auth.Value.GenerateEmailVerificationLinkAsync(request.RecipientAddress, actionSettings, cancellationToken),
            EmailAuthActionType.PasswordReset =>
                await _auth.Value.GeneratePasswordResetLinkAsync(request.RecipientAddress, actionSettings, cancellationToken),
            EmailAuthActionType.EmailSignIn =>
                await _auth.Value.GenerateSignInWithEmailLinkAsync(request.RecipientAddress, actionSettings, cancellationToken),
            _ => throw new EmailIntentValidationException("The Firebase Auth action type is not catalogued.")
        };

        cancellationToken.ThrowIfCancellationRequested();
        return link;
    }

    private FirebaseAuth CreateFirebaseAuth()
    {
        if (string.IsNullOrWhiteSpace(_settings.FirebaseProjectId))
            throw new EmailIntentValidationException("The Firebase project ID is not configured for email materialization.");

        var app = FirebaseApp.GetInstance(FirebaseAppName)
            ?? FirebaseApp.Create(
                new AppOptions
                {
                    ProjectId = _settings.FirebaseProjectId.Trim(),
                    Credential = GoogleCredential.GetApplicationDefault()
                },
                FirebaseAppName);

        return FirebaseAuth.GetAuth(app);
    }

    private string ValidateContinueUrl(string candidate)
    {
        if (!Uri.TryCreate(candidate?.Trim(), UriKind.Absolute, out var uri) ||
            !string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase) ||
            string.IsNullOrWhiteSpace(uri.Host) ||
            !string.IsNullOrEmpty(uri.UserInfo) ||
            !uri.IsDefaultPort)
        {
            throw new EmailIntentValidationException(
                "The Firebase Auth continue URL must be an absolute HTTPS URL without credentials or a custom port.");
        }

        var allowed = _settings.ContinueUrlAllowedHosts.Any(host =>
            string.Equals(NormalizeHost(host), uri.IdnHost, StringComparison.OrdinalIgnoreCase));
        if (!allowed)
            throw new EmailIntentValidationException("The Firebase Auth continue URL host is not allowlisted.");

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
            throw new EmailIntentValidationException("The Firebase Auth continue URL allowlist contains an invalid host.");
        }

        return new UriBuilder(Uri.UriSchemeHttps, host.Trim()).Uri.IdnHost;
    }
}
