using Microsoft.Extensions.Options;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Settings;

namespace swiftpay_api_core.Services;

public sealed class PlatformAuthActionLinkGenerator : IPlatformAuthActionLinkGenerator
{
    private readonly EmailPlatformSettings _settings;

    public PlatformAuthActionLinkGenerator(IOptions<EmailPlatformSettings> settings)
    {
        _settings = settings.Value;
    }

    public Task<string> GenerateAsync(
        EmailAuthActionLinkRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        cancellationToken.ThrowIfCancellationRequested();

        var continueUrl = ValidateContinueUrl(request.ContinueUrl);
        var actionType = request.ActionType switch
        {
            EmailAuthActionType.VerifyEmail => "verify-email",
            EmailAuthActionType.PasswordReset => "forgot-password",
            EmailAuthActionType.EmailSignIn => "signin",
            _ => throw new EmailIntentValidationException("The auth action type is not supported.")
        };

        var baseUrl = _settings.BaseUrl.TrimEnd('/');
        var link = $"{baseUrl}/?auth={actionType}&token={request.RecipientAddress}";

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

        return new UriBuilder(uri)
        {
            Scheme = Uri.UriSchemeHttps,
            Host = uri.IdnHost.ToLowerInvariant(),
            Port = -1
        }.Uri.AbsoluteUri;
    }
}
