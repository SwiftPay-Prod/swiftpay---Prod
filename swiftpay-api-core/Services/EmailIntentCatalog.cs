internal readonly record struct CanonicalEmailIntentRequest(
    string RecipientAddress,
    string CorrelationId,
    string RequestPayloadJson,
    string RequestHash,
    string? ContinueUrl);

internal static class EmailIntentCanonicalizer
{
    private const int MaxRecipientLength = 320;
    private const int MaxCorrelationIdLength = 128;
    private const int MaxInputKeyLength = 128;
    private const int MaxInputValueLength = 16_384;
    private const int MaxCustomSubjectLength = 998;
    private const int MaxCustomBodyLength = 131_072;


    public static CanonicalEmailIntentRequest Canonicalize(
        EmailIntentAddRequest request,
        EmailIntentCatalogDefinition definition)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.Owner.Id == Guid.Empty)
            throw new EmailIntentValidationException("An owner identifier is required.");
        if (!Enum.IsDefined(request.Owner.Type))
            throw new EmailIntentValidationException("The owner type is not catalogued.");
        if (string.IsNullOrWhiteSpace(request.Dedupe.Value))
            throw new EmailIntentValidationException("A catalogued dedupe key is required.");
        if (request.Dedupe.Value.Length > 512)
            throw new EmailIntentValidationException("The dedupe key exceeds the persisted limit.");

        var recipient = NormalizeRecipient(request.RecipientAddress);
        var correlationId = NormalizeRequired(request.CorrelationId, MaxCorrelationIdLength, "correlation ID");
        var authAction = NormalizeAuthAction(request.AuthAction, definition);
        var customHtml = NormalizeCustomHtml(request.CustomHtml, request.MessageType);
        var inputs = NormalizeInputs(request.Inputs);
        if (request.MessageType == EmailMessageType.CustomHtml && inputs.Length != 0)
            throw new EmailIntentValidationException("Custom HTML intents cannot contain untyped Inputs.");
        var buffer = new ArrayBufferWriter<byte>(Math.Max(1024, inputs.Length * 128));
        using (var writer = new Utf8JsonWriter(buffer))
        {
            writer.WriteStartObject();
            writer.WritePropertyName("authAction");
            if (authAction is null)
            {
                writer.WriteNullValue();
            }
            else
            {
                writer.WriteStartObject();
                writer.WriteString("actionType", authAction.Value.ActionType.ToString());
                writer.WriteString("continueUrl", authAction.Value.ContinueUrl);
                writer.WriteEndObject();
            }
            writer.WritePropertyName("customHtml");
            if (customHtml is null)
            {
                writer.WriteNullValue();
            }
            else
            {
                writer.WriteStartObject();
                writer.WriteString("html", customHtml.Value.Html);
                writer.WriteString("subject", customHtml.Value.Subject);
                writer.WriteString("text", customHtml.Value.Text);
                writer.WriteEndObject();
            }

            if (request.Dedupe.CooldownWindowUtc.HasValue)
                writer.WriteString("cooldownWindowUtc", request.Dedupe.CooldownWindowUtc.Value);
            else
                writer.WriteNull("cooldownWindowUtc");

            writer.WriteString("deliveryClass", definition.DeliveryClass.ToString());
            writer.WritePropertyName("inputs");
            writer.WriteStartObject();
            foreach (var input in inputs)
                writer.WriteString(input.Key, input.Value);
            writer.WriteEndObject();
            writer.WriteString("intentKind", definition.IntentKind.ToString());
            writer.WriteString("messageType", definition.MessageType.ToString());
            writer.WriteStartObject("owner");
            writer.WriteString("id", request.Owner.Id.ToString("N"));
            writer.WriteString("type", request.Owner.Type.ToString());
            writer.WriteEndObject();
            writer.WriteString("recipient", recipient);
            writer.WriteNumber("templateVersion", definition.TemplateVersion);
            writer.WriteEndObject();
        }

        var canonicalJson = Encoding.UTF8.GetString(buffer.WrittenSpan);
        return new CanonicalEmailIntentRequest(
            recipient,
            correlationId,
            canonicalJson,
            EmailIntentHash.ComputeSha256(buffer.WrittenSpan),
            authAction?.ContinueUrl);
    }

    internal static string NormalizeRecipient(string value)
    {
        if (string.IsNullOrWhiteSpace(value) || !MailAddress.TryCreate(value.Trim(), out var address))
            throw new EmailIntentValidationException("A valid recipient address is required.");
        if (!string.IsNullOrEmpty(address.DisplayName))
            throw new EmailIntentValidationException("Recipient display names are not accepted.");

        var normalized = address.Address.ToLowerInvariant();
        if (normalized.Length > MaxRecipientLength)
            throw new EmailIntentValidationException("The recipient address exceeds the persisted limit.");

        return normalized;
    }

    private static CanonicalAuthAction? NormalizeAuthAction(
        EmailIntentAuthActionRequest? action,
        EmailIntentCatalogDefinition definition)
    {
        if (definition.IntentKind == EmailIntentKind.Template)
        {
            if (action is not null)
                throw new EmailIntentValidationException("Template intents cannot contain an Auth action request.");
            return null;
        }

        if (action is null || action.ActionType != definition.RequiredAuthActionType)
            throw new EmailIntentValidationException("The catalogued auth action request is required.");

        if (!Uri.TryCreate(action.ContinueUrl?.Trim(), UriKind.Absolute, out var continueUri) ||
            !string.Equals(continueUri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
        {
            throw new EmailIntentValidationException("The Auth continue URL must be an absolute HTTPS URL.");
        }

        var builder = new UriBuilder(continueUri)
        {
            Host = continueUri.IdnHost.ToLowerInvariant(),
            Scheme = Uri.UriSchemeHttps,
            Port = continueUri.IsDefaultPort ? -1 : continueUri.Port
        };

        return new CanonicalAuthAction(action.ActionType, builder.Uri.AbsoluteUri);
    }
    private static CanonicalCustomHtml? NormalizeCustomHtml(
        EmailIntentCustomHtmlRequest? customHtml,
        EmailMessageType messageType)
    {
        if (messageType != EmailMessageType.CustomHtml)
        {
            if (customHtml is not null)
                throw new EmailIntentValidationException("Only CustomHtml intents can contain trusted HTML.");
            return null;
        }

        if (customHtml?.Body is null)
            throw new EmailIntentValidationException("CustomHtml intents require explicitly trusted HTML and a text fallback.");

        var subject = NormalizeRequired(customHtml.Subject, MaxCustomSubjectLength, "custom HTML subject");
        if (customHtml.Body.Html.Length == 0 || customHtml.Body.Html.Length > MaxCustomBodyLength)
            throw new EmailIntentValidationException("The trusted HTML body is empty or exceeds the persisted limit.");
        if (string.IsNullOrWhiteSpace(customHtml.Body.TextFallback) ||
            customHtml.Body.TextFallback.Length > MaxCustomBodyLength)
        {
            throw new EmailIntentValidationException("A non-empty custom HTML text fallback within the persisted limit is required.");
        }

        return new CanonicalCustomHtml(subject, customHtml.Body.Html, customHtml.Body.TextFallback);
    }


    private static KeyValuePair<string, string>[] NormalizeInputs(IReadOnlyDictionary<string, string>? inputs)
    {
        if (inputs is null || inputs.Count == 0)
            return [];

        var normalized = new KeyValuePair<string, string>[inputs.Count];
        var index = 0;
        foreach (var input in inputs)
        {
            var key = NormalizeRequired(input.Key, MaxInputKeyLength, "input key");
            if (input.Value is null || input.Value.Length > MaxInputValueLength)
                throw new EmailIntentValidationException("An input value exceeds the persisted limit.");
            normalized[index++] = new KeyValuePair<string, string>(key, input.Value);
        }

        Array.Sort(normalized, static (left, right) => StringComparer.Ordinal.Compare(left.Key, right.Key));
        for (var current = 1; current < normalized.Length; current++)
        {
            if (string.Equals(normalized[current - 1].Key, normalized[current].Key, StringComparison.Ordinal))
                throw new EmailIntentValidationException("Canonical input keys must be unique.");
        }

        return normalized;
    }

    private static string NormalizeRequired(string value, int maximumLength, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new EmailIntentValidationException($"A non-empty {fieldName} is required.");

        var normalized = value.Trim();
        if (normalized.Length > maximumLength)
            throw new EmailIntentValidationException($"The {fieldName} exceeds the persisted limit.");

        return normalized;
    }

    private readonly record struct CanonicalAuthAction(
        EmailAuthActionType ActionType,
        string ContinueUrl);
    private readonly record struct CanonicalCustomHtml(
        string Subject,
        string Html,
        string Text);
}
