using System.Collections.ObjectModel;

namespace swiftpay_api_core.Models.Email;

public enum EmailTemplateValueKind
{
    Text,
    Url,
    TrustedHtml
}

public enum EmailTemplateRenderError
{
    InvalidTemplate,
    MissingPlaceholder,
    UnknownPlaceholder,
    DuplicatePlaceholder,
    InvalidValueType,
    InvalidUrl,
    TrustedHtmlNotAllowed
}

public sealed class EmailTemplateRenderException(
    EmailTemplateRenderError error,
    string message,
    string? placeholderName = null) : InvalidOperationException(message)
{
    public EmailTemplateRenderError Error { get; } = error;

    public string? PlaceholderName { get; } = placeholderName;
}

public sealed record EmailTemplatePlaceholderDefinition
{
    public EmailTemplatePlaceholderDefinition(string name, EmailTemplateValueKind kind)
    {
        Name = name ?? throw new ArgumentNullException(nameof(name));
        Kind = kind;
    }

    public string Name { get; }

    public EmailTemplateValueKind Kind { get; }
}

public sealed record EmailTemplateSource
{
    public EmailTemplateSource(
        string templateName,
        int version,
        string subjectTemplate,
        string htmlTemplate,
        string textTemplate,
        IEnumerable<EmailTemplatePlaceholderDefinition> placeholders)
    {
        TemplateName = templateName ?? throw new ArgumentNullException(nameof(templateName));
        Version = version;
        SubjectTemplate = subjectTemplate ?? throw new ArgumentNullException(nameof(subjectTemplate));
        HtmlTemplate = htmlTemplate ?? throw new ArgumentNullException(nameof(htmlTemplate));
        TextTemplate = textTemplate ?? throw new ArgumentNullException(nameof(textTemplate));
        Placeholders = new ReadOnlyCollection<EmailTemplatePlaceholderDefinition>(
            (placeholders ?? throw new ArgumentNullException(nameof(placeholders))).ToArray());
    }

    public string TemplateName { get; }

    public int Version { get; }

    public string SubjectTemplate { get; }

    public string HtmlTemplate { get; }

    public string TextTemplate { get; }

    public IReadOnlyList<EmailTemplatePlaceholderDefinition> Placeholders { get; }
}

public abstract record EmailTemplateValue
{
    private protected EmailTemplateValue()
    {
    }

    public abstract EmailTemplateValueKind Kind { get; }
}

public sealed record EmailTextValue : EmailTemplateValue
{
    public EmailTextValue(string value)
    {
        Value = value ?? throw new ArgumentNullException(nameof(value));
    }

    public override EmailTemplateValueKind Kind => EmailTemplateValueKind.Text;

    public string Value { get; }
}

public sealed record EmailUrlValue : EmailTemplateValue
{
    private EmailUrlValue(string value)
    {
        Value = value;
    }

    public override EmailTemplateValueKind Kind => EmailTemplateValueKind.Url;

    internal string Value { get; }

    public static EmailUrlValue FromUntrusted(string value) =>
        new(value ?? throw new ArgumentNullException(nameof(value)));
}

public sealed record TrustedEmailHtmlValue : EmailTemplateValue
{
    private TrustedEmailHtmlValue(string html, string textFallback)
    {
        Html = html;
        TextFallback = textFallback;
    }

    public override EmailTemplateValueKind Kind => EmailTemplateValueKind.TrustedHtml;

    internal string Html { get; }

    internal string TextFallback { get; }

    public static TrustedEmailHtmlValue FromTrustedSource(string html, string textFallback) =>
        new(
            html ?? throw new ArgumentNullException(nameof(html)),
            textFallback ?? throw new ArgumentNullException(nameof(textFallback)));
}

public sealed record EmailTemplateParameter
{
    public EmailTemplateParameter(string name, EmailTemplateValue value)
    {
        Name = name ?? throw new ArgumentNullException(nameof(name));
        Value = value ?? throw new ArgumentNullException(nameof(value));
    }

    public string Name { get; }

    public EmailTemplateValue Value { get; }
}

public sealed class EmailUrlAllowlist
{
    private readonly HashSet<string> _allowedHosts;

    public EmailUrlAllowlist(IEnumerable<string> allowedHosts)
    {
        ArgumentNullException.ThrowIfNull(allowedHosts);

        _allowedHosts = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var host in allowedHosts)
        {
            if (string.IsNullOrWhiteSpace(host)
                || host.Contains('/')
                || host.Contains(':')
                || host.Contains('*')
                || Uri.CheckHostName(host) is UriHostNameType.Unknown)
            {
                throw new ArgumentException($"Invalid email URL allowlist host '{host}'.", nameof(allowedHosts));
            }

            var normalizedHost = new UriBuilder(Uri.UriSchemeHttps, host).Uri.IdnHost;
            _allowedHosts.Add(normalizedHost);
        }

        if (_allowedHosts.Count == 0)
        {
            throw new ArgumentException("At least one email URL host must be allowlisted.", nameof(allowedHosts));
        }
    }

    internal bool Contains(string idnHost) => _allowedHosts.Contains(idnHost);
}

public sealed record RenderedEmailTemplate
{
    public RenderedEmailTemplate(
        string templateName,
        int version,
        string subject,
        string htmlBody,
        string textBody)
    {
        TemplateName = templateName;
        Version = version;
        Subject = subject;
        HtmlBody = htmlBody;
        TextBody = textBody;
    }

    public string TemplateName { get; }

    public int Version { get; }

    public string Subject { get; }

    public string HtmlBody { get; }

    public string TextBody { get; }
}
