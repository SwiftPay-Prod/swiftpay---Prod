using System.Net;
using System.Text.RegularExpressions;

namespace swiftpay_api_core.Services;

public enum NotificationTemplateRenderError
{
    InvalidTemplate,
    MissingPlaceholder,
    UnknownPlaceholder
}

public sealed class NotificationTemplateRenderException(
    NotificationTemplateRenderError error,
    string message,
    string? placeholderName = null) : InvalidOperationException(message)
{
    public NotificationTemplateRenderError Error { get; } = error;

    public string? PlaceholderName { get; } = placeholderName;
}

public static partial class NotificationTemplateRenderer
{
    public static readonly IReadOnlyList<string> AllowedPlaceholders =
    [
        "amount",
        "netAmount",
        "customerName",
        "orderId",
        "transactionId",
        "pixKey"
    ];

    private static readonly HashSet<string> AllowedPlaceholderSet = new(
        AllowedPlaceholders,
        StringComparer.Ordinal);

    [GeneratedRegex(@"\{([^{}]*)\}", RegexOptions.CultureInvariant)]
    private static partial Regex PlaceholderRegex();

    public static void Validate(string template)
    {
        ArgumentNullException.ThrowIfNull(template);
        ValidatePlaceholders(template);
    }

    public static string Render(string template, IReadOnlyDictionary<string, string> values)
    {
        ArgumentNullException.ThrowIfNull(template);
        ArgumentNullException.ThrowIfNull(values);

        var placeholderCount = ValidatePlaceholders(template);
        if (placeholderCount == 0)
        {
            return template;
        }

        var rendered = PlaceholderRegex().Replace(template, match =>
        {
            var placeholderName = match.Groups[1].Value;
            if (!values.TryGetValue(placeholderName, out var value))
            {
                throw new NotificationTemplateRenderException(
                    NotificationTemplateRenderError.MissingPlaceholder,
                    $"O valor do placeholder {{{placeholderName}}} não foi informado.",
                    placeholderName);
            }

            return WebUtility.HtmlEncode(value);
        });

        return rendered;
    }

    private static int ValidatePlaceholders(string template)
    {
        var matches = PlaceholderRegex().Matches(template);
        var textWithoutPlaceholders = PlaceholderRegex().Replace(template, string.Empty);
        if (textWithoutPlaceholders.Contains('{') || textWithoutPlaceholders.Contains('}'))
        {
            throw new NotificationTemplateRenderException(
                NotificationTemplateRenderError.InvalidTemplate,
                "O template contém delimitadores de placeholder inválidos.");
        }

        foreach (Match match in matches)
        {
            var placeholderName = match.Groups[1].Value;
            if (placeholderName.Length == 0)
            {
                throw new NotificationTemplateRenderException(
                    NotificationTemplateRenderError.InvalidTemplate,
                    "O template contém um placeholder vazio.");
            }

            if (!AllowedPlaceholderSet.Contains(placeholderName))
            {
                throw new NotificationTemplateRenderException(
                    NotificationTemplateRenderError.UnknownPlaceholder,
                    $"Placeholder {{{placeholderName}}} não permitido. Permitidos: {string.Join(", ", AllowedPlaceholders.Select(name => $"{{{name}}}"))}.",
                    placeholderName);
            }
        }

        return matches.Count;
    }
}
