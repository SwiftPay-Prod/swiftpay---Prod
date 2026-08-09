using System.Text;
using System.Text.Encodings.Web;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Email;

namespace swiftpay_api_core.Services;

public sealed class EmailTemplateRenderer : IEmailTemplateRenderer
{
    public RenderedEmailTemplate Render(
        EmailTemplateSource template,
        IEnumerable<EmailTemplateParameter> parameters,
        EmailUrlAllowlist urlAllowlist)
    {
        ArgumentNullException.ThrowIfNull(template);
        ArgumentNullException.ThrowIfNull(parameters);
        ArgumentNullException.ThrowIfNull(urlAllowlist);

        ValidateTemplateMetadata(template);

        var subject = ParseTemplate(template.SubjectTemplate, "subject");
        var html = ParseTemplate(template.HtmlTemplate, "HTML body");
        var text = ParseTemplate(template.TextTemplate, "text body");
        var definitions = BuildDefinitions(template.Placeholders);
        var bindings = BuildBindings(parameters);
        var referencedNames = new HashSet<string>(StringComparer.Ordinal);

        ValidateTemplateReferences(subject, definitions, referencedNames);
        ValidateTemplateReferences(html, definitions, referencedNames);
        ValidateTemplateReferences(text, definitions, referencedNames);

        foreach (var definition in definitions.Values)
        {
            if (!referencedNames.Contains(definition.Name))
            {
                throw Error(
                    EmailTemplateRenderError.UnknownPlaceholder,
                    definition.Name,
                    $"Placeholder '{definition.Name}' is declared but is not used by the template.");
            }
        }

        foreach (var binding in bindings)
        {
            if (!definitions.ContainsKey(binding.Key))
            {
                throw Error(
                    EmailTemplateRenderError.UnknownPlaceholder,
                    binding.Key,
                    $"Placeholder '{binding.Key}' was supplied but is not declared by the template.");
            }
        }

        foreach (var definition in definitions.Values)
        {
            if (!bindings.TryGetValue(definition.Name, out var value))
            {
                throw Error(
                    EmailTemplateRenderError.MissingPlaceholder,
                    definition.Name,
                    $"Placeholder '{definition.Name}' has no value.");
            }

            if (value.Kind != definition.Kind)
            {
                throw Error(
                    EmailTemplateRenderError.InvalidValueType,
                    definition.Name,
                    $"Placeholder '{definition.Name}' requires {definition.Kind}, but received {value.Kind}.");
            }
        }

        var subjectNames = subject.Placeholders
            .Select(placeholder => placeholder.Name)
            .ToHashSet(StringComparer.Ordinal);
        var prepared = PrepareValues(definitions, bindings, subjectNames, urlAllowlist);

        return new RenderedEmailTemplate(
            template.TemplateName,
            template.Version,
            RenderTemplate(subject, prepared, TemplateOutput.Subject),
            RenderTemplate(html, prepared, TemplateOutput.Html),
            RenderTemplate(text, prepared, TemplateOutput.Text));
    }

    private static void ValidateTemplateMetadata(EmailTemplateSource template)
    {
        if (string.IsNullOrWhiteSpace(template.TemplateName)
            || template.Version <= 0
            || string.IsNullOrWhiteSpace(template.SubjectTemplate)
            || string.IsNullOrWhiteSpace(template.HtmlTemplate)
            || string.IsNullOrWhiteSpace(template.TextTemplate))
        {
            throw new EmailTemplateRenderException(
                EmailTemplateRenderError.InvalidTemplate,
                "Template name, positive version, subject, HTML body and text body are required.");
        }
    }

    private static IReadOnlyDictionary<string, EmailTemplatePlaceholderDefinition> BuildDefinitions(
        IReadOnlyList<EmailTemplatePlaceholderDefinition> definitions)
    {
        var result = new Dictionary<string, EmailTemplatePlaceholderDefinition>(StringComparer.Ordinal);

        foreach (var definition in definitions)
        {
            if (definition is null || !IsValidPlaceholderName(definition.Name))
            {
                throw new EmailTemplateRenderException(
                    EmailTemplateRenderError.InvalidTemplate,
                    $"Invalid placeholder declaration '{definition?.Name}'.",
                    definition?.Name);
            }

            if (!result.TryAdd(definition.Name, definition))
            {
                throw Error(
                    EmailTemplateRenderError.DuplicatePlaceholder,
                    definition.Name,
                    $"Placeholder '{definition.Name}' is declared more than once.");
            }
        }

        return result;
    }

    private static IReadOnlyDictionary<string, EmailTemplateValue> BuildBindings(
        IEnumerable<EmailTemplateParameter> parameters)
    {
        var result = new Dictionary<string, EmailTemplateValue>(StringComparer.Ordinal);

        foreach (var parameter in parameters)
        {
            if (parameter is null || !IsValidPlaceholderName(parameter.Name))
            {
                throw new EmailTemplateRenderException(
                    EmailTemplateRenderError.InvalidTemplate,
                    $"Invalid placeholder binding '{parameter?.Name}'.",
                    parameter?.Name);
            }

            if (!result.TryAdd(parameter.Name, parameter.Value))
            {
                throw Error(
                    EmailTemplateRenderError.DuplicatePlaceholder,
                    parameter.Name,
                    $"Placeholder '{parameter.Name}' was supplied more than once.");
            }
        }

        return result;
    }

    private static void ValidateTemplateReferences(
        ParsedTemplate template,
        IReadOnlyDictionary<string, EmailTemplatePlaceholderDefinition> definitions,
        HashSet<string> referencedNames)
    {
        foreach (var placeholder in template.Placeholders)
        {
            if (!definitions.ContainsKey(placeholder.Name))
            {
                throw Error(
                    EmailTemplateRenderError.UnknownPlaceholder,
                    placeholder.Name,
                    $"Placeholder '{placeholder.Name}' in the {template.SectionName} is not declared.");
            }

            referencedNames.Add(placeholder.Name);
        }
    }

    private static IReadOnlyDictionary<string, PreparedValue> PrepareValues(
        IReadOnlyDictionary<string, EmailTemplatePlaceholderDefinition> definitions,
        IReadOnlyDictionary<string, EmailTemplateValue> bindings,
        IReadOnlySet<string> subjectNames,
        EmailUrlAllowlist urlAllowlist)
    {
        var prepared = new Dictionary<string, PreparedValue>(StringComparer.Ordinal);

        foreach (var definition in definitions.Values)
        {
            var value = bindings[definition.Name];
            switch (value)
            {
                case EmailTextValue text:
                    prepared.Add(
                        definition.Name,
                        new PreparedValue(
                            HtmlEncoder.Default.Encode(text.Value),
                            text.Value,
                            text.Value));
                    break;

                case EmailUrlValue url:
                    var normalizedUrl = ValidateUrl(url.Value, definition.Name, urlAllowlist);
                    prepared.Add(
                        definition.Name,
                        new PreparedValue(
                            HtmlEncoder.Default.Encode(normalizedUrl),
                            normalizedUrl,
                            normalizedUrl));
                    break;

                case TrustedEmailHtmlValue trustedHtml:
                    if (subjectNames.Contains(definition.Name))
                    {
                        throw Error(
                            EmailTemplateRenderError.TrustedHtmlNotAllowed,
                            definition.Name,
                            $"Trusted HTML placeholder '{definition.Name}' cannot be used in a subject.");
                    }

                    prepared.Add(
                        definition.Name,
                        new PreparedValue(trustedHtml.Html, trustedHtml.TextFallback, null));
                    break;

                default:
                    throw Error(
                        EmailTemplateRenderError.InvalidValueType,
                        definition.Name,
                        $"Placeholder '{definition.Name}' has an unsupported value type.");
            }
        }

        return prepared;
    }

    private static string ValidateUrl(string candidate, string placeholderName, EmailUrlAllowlist allowlist)
    {
        if (!Uri.TryCreate(candidate, UriKind.Absolute, out var uri)
            || !string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase)
            || string.IsNullOrWhiteSpace(uri.Host)
            || !string.IsNullOrEmpty(uri.UserInfo)
            || !allowlist.Contains(uri.IdnHost))
        {
            throw Error(
                EmailTemplateRenderError.InvalidUrl,
                placeholderName,
                $"Placeholder '{placeholderName}' must be an absolute HTTPS URL on an allowlisted host.");
        }

        return uri.AbsoluteUri;
    }

    private static ParsedTemplate ParseTemplate(string template, string sectionName)
    {
        var placeholders = new List<PlaceholderOccurrence>();
        var names = new HashSet<string>(StringComparer.Ordinal);
        var cursor = 0;

        while (cursor < template.Length)
        {
            var openIndex = template.IndexOf("[[", cursor, StringComparison.Ordinal);
            var unexpectedCloseIndex = template.IndexOf("]]", cursor, StringComparison.Ordinal);

            if (unexpectedCloseIndex >= 0 && (openIndex < 0 || unexpectedCloseIndex < openIndex))
            {
                throw InvalidPlaceholderSyntax(sectionName);
            }

            if (openIndex < 0)
            {
                break;
            }

            var closeIndex = template.IndexOf("]]", openIndex + 2, StringComparison.Ordinal);
            if (closeIndex < 0)
            {
                throw InvalidPlaceholderSyntax(sectionName);
            }

            var nestedOpenIndex = template.IndexOf("[[", openIndex + 2, StringComparison.Ordinal);
            if (nestedOpenIndex >= 0 && nestedOpenIndex < closeIndex)
            {
                throw InvalidPlaceholderSyntax(sectionName);
            }

            var name = template[(openIndex + 2)..closeIndex];
            if (!IsValidPlaceholderName(name))
            {
                throw new EmailTemplateRenderException(
                    EmailTemplateRenderError.InvalidTemplate,
                    $"The {sectionName} contains an invalid placeholder name '{name}'.",
                    name);
            }

            if (!names.Add(name))
            {
                throw Error(
                    EmailTemplateRenderError.DuplicatePlaceholder,
                    name,
                    $"Placeholder '{name}' occurs more than once in the {sectionName}.");
            }

            placeholders.Add(new PlaceholderOccurrence(openIndex, closeIndex + 2 - openIndex, name));
            cursor = closeIndex + 2;
        }

        if (template.IndexOf("]]", cursor, StringComparison.Ordinal) >= 0)
        {
            throw InvalidPlaceholderSyntax(sectionName);
        }

        return new ParsedTemplate(template, sectionName, placeholders);
    }

    private static string RenderTemplate(
        ParsedTemplate template,
        IReadOnlyDictionary<string, PreparedValue> values,
        TemplateOutput output)
    {
        if (template.Placeholders.Count == 0)
        {
            return template.Content;
        }

        var result = new StringBuilder(template.Content.Length);
        var cursor = 0;

        foreach (var placeholder in template.Placeholders)
        {
            result.Append(template.Content, cursor, placeholder.Start - cursor);
            var value = values[placeholder.Name];
            result.Append(output switch
            {
                TemplateOutput.Html => value.Html,
                TemplateOutput.Text => value.Text,
                TemplateOutput.Subject => value.Subject,
                _ => throw new ArgumentOutOfRangeException(nameof(output))
            });
            cursor = placeholder.Start + placeholder.Length;
        }

        result.Append(template.Content, cursor, template.Content.Length - cursor);
        return result.ToString();
    }

    private static bool IsValidPlaceholderName(string name)
    {
        if (string.IsNullOrEmpty(name) || name[0] is < 'A' or > 'Z')
        {
            return false;
        }

        for (var index = 1; index < name.Length; index++)
        {
            var character = name[index];
            if (character != '_' && (character is < 'A' or > 'Z') && (character is < '0' or > '9'))
            {
                return false;
            }
        }

        return true;
    }

    private static EmailTemplateRenderException InvalidPlaceholderSyntax(string sectionName) =>
        new(
            EmailTemplateRenderError.InvalidTemplate,
            $"The {sectionName} contains malformed placeholder delimiters.");

    private static EmailTemplateRenderException Error(
        EmailTemplateRenderError error,
        string placeholderName,
        string message) => new(error, message, placeholderName);

    private enum TemplateOutput
    {
        Subject,
        Html,
        Text
    }

    private sealed record PlaceholderOccurrence(int Start, int Length, string Name);

    private sealed record ParsedTemplate(
        string Content,
        string SectionName,
        IReadOnlyList<PlaceholderOccurrence> Placeholders);

    private sealed record PreparedValue(string Html, string Text, string? Subject);
}
