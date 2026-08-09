using System.Collections.ObjectModel;
using System.Net;
using System.Text.RegularExpressions;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Email;

namespace swiftpay_api_core.Services;

public sealed class EmailMessageTemplateCatalog(IEmailTemplateProvider templateProvider)
    : IEmailMessageTemplateCatalog
{
    private static readonly Regex PlaceholderRegex = new(
        @"\[\[([A-Za-z][A-Za-z0-9_.-]*)\]\]",
        RegexOptions.CultureInvariant | RegexOptions.Compiled);
    private static readonly Regex StyleOrScriptRegex = new(
        @"<(style|script)\b[^>]*>.*?</\1>",
        RegexOptions.IgnoreCase | RegexOptions.Singleline | RegexOptions.CultureInvariant | RegexOptions.Compiled);
    private static readonly Regex CommentRegex = new(
        @"<!--.*?-->",
        RegexOptions.Singleline | RegexOptions.CultureInvariant | RegexOptions.Compiled);
    private static readonly Regex TagRegex = new(
        @"<[^>]+>",
        RegexOptions.Singleline | RegexOptions.CultureInvariant | RegexOptions.Compiled);
    private static readonly Regex WhitespaceRegex = new(
        @"\s+",
        RegexOptions.CultureInvariant | RegexOptions.Compiled);

    private readonly Dictionary<EmailMessageType, EmailMessageTemplateDefinition> _cache = [];

    public async Task<EmailMessageTemplateDefinition> GetDefinitionAsync(
        EmailMessageType messageType,
        CancellationToken cancellationToken = default)
    {
        if (_cache.TryGetValue(messageType, out var cached))
            return cached;

        var descriptor = GetDescriptor(messageType);
        EmailMessageTemplateDefinition definition;
        if (messageType == EmailMessageType.CustomHtml)
        {
            var source = new EmailTemplateSource(
                nameof(EmailMessageType.CustomHtml),
                descriptor.Version,
                "[[CUSTOM_SUBJECT]]",
                "[[CUSTOM_CONTENT]]",
                "[[CUSTOM_CONTENT]]",
                [
                    new EmailTemplatePlaceholderDefinition("CUSTOM_SUBJECT", EmailTemplateValueKind.Text),
                    new EmailTemplatePlaceholderDefinition("CUSTOM_CONTENT", EmailTemplateValueKind.TrustedHtml)
                ]);
            definition = CreateDefinition(messageType, descriptor.SendWithin, source,
                new Dictionary<string, string>(StringComparer.Ordinal)
                {
                    ["CUSTOM_SUBJECT"] = "CUSTOM_SUBJECT",
                    ["CUSTOM_CONTENT"] = "CUSTOM_CONTENT"
                });
        }
        else
        {
            var html = await templateProvider.GetTemplateContentAsync(descriptor.LegacyTemplate!.Value);
            if (messageType == EmailMessageType.PasswordReset)
                html = AdaptPasswordResetToActionLink(html);

            var normalized = NormalizePlaceholders(html);
            var text = messageType == EmailMessageType.PasswordReset
                ? "Olá, [[NAME]]. Redefina sua senha em [[RESET_PASSWORD_URL]]. Este link expira em [[EXPIRES_IN]] minutos."
                : CreateTextFallback(normalized.Content);
            var textNormalized = NormalizePlaceholders(text, normalized.Counts);
            var aliases = new Dictionary<string, string>(StringComparer.Ordinal);
            foreach (var pair in normalized.InputKeyByPlaceholder)
                aliases.TryAdd(pair.Key, pair.Value);
            foreach (var pair in textNormalized.InputKeyByPlaceholder)
                aliases.TryAdd(pair.Key, pair.Value);
            var placeholders = aliases
                .Select(pair => new EmailTemplatePlaceholderDefinition(
                    pair.Key,
                    GetValueKind(pair.Value)))
                .ToArray();
            var source = new EmailTemplateSource(
                messageType.ToString(),
                descriptor.Version,
                descriptor.Subject,
                normalized.Content,
                textNormalized.Content,
                placeholders);
            definition = CreateDefinition(messageType, descriptor.SendWithin, source, aliases);
        }

        _cache.Add(messageType, definition);
        return definition;
    }

    public BoundEmailMessageTemplate Bind(
        EmailMessageTemplateDefinition definition,
        EmailMessageTemplateValues values)
    {
        ArgumentNullException.ThrowIfNull(definition);
        ArgumentNullException.ThrowIfNull(values);

        var normalizedInputs = NormalizeInputs(values.Inputs);
        var usedInputs = new HashSet<string>(StringComparer.Ordinal);
        var parameters = new EmailTemplateParameter[definition.Template.Placeholders.Count];

        for (var index = 0; index < definition.Template.Placeholders.Count; index++)
        {
            var placeholder = definition.Template.Placeholders[index];
            var inputKey = definition.InputKeyByPlaceholder[placeholder.Name];
            EmailTemplateValue value;
            if (inputKey == "CUSTOM_SUBJECT")
            {
                value = new EmailTextValue(values.CustomSubject
                    ?? throw Missing(inputKey));
            }
            else if (inputKey == "CUSTOM_CONTENT")
            {
                value = values.CustomBody ?? throw Missing(inputKey);
            }
            else if (IsAuthActionLink(inputKey, definition.MessageType))
            {
                value = EmailUrlValue.FromUntrusted(values.AuthActionLink
                    ?? throw Missing(inputKey));
            }
            else if (inputKey == "EXPIRES_IN" &&
                     definition.MessageType is EmailMessageType.EmailConfirmation or EmailMessageType.PasswordReset)
            {
                var expiry = definition.MessageType == EmailMessageType.EmailConfirmation
                    ? ((int)definition.SendWithin.TotalHours).ToString()
                    : ((int)definition.SendWithin.TotalMinutes).ToString();
                value = new EmailTextValue(expiry);
            }
            else
            {
                if (!normalizedInputs.TryGetValue(inputKey, out var rawValue))
                    throw Missing(inputKey);

                usedInputs.Add(inputKey);
                value = placeholder.Kind switch
                {
                    EmailTemplateValueKind.Text => new EmailTextValue(rawValue),
                    EmailTemplateValueKind.Url => EmailUrlValue.FromUntrusted(rawValue),
                    EmailTemplateValueKind.TrustedHtml => throw new EmailIntentValidationException(
                        "Trusted HTML cannot be reconstructed from frozen string Inputs."),
                    _ => throw new EmailIntentValidationException("The template contains an unsupported placeholder kind.")
                };
            }

            parameters[index] = new EmailTemplateParameter(placeholder.Name, value);
        }

        var unknownInput = normalizedInputs.Keys.FirstOrDefault(key => !usedInputs.Contains(key));
        if (unknownInput is not null)
            throw new EmailIntentValidationException("The frozen Inputs contain a placeholder not declared by the catalog.");

        return new BoundEmailMessageTemplate
        {
            Definition = definition,
            Parameters = parameters
        };
    }

    private static EmailMessageTemplateDefinition CreateDefinition(
        EmailMessageType messageType,
        TimeSpan sendWithin,
        EmailTemplateSource source,
        IReadOnlyDictionary<string, string> aliases) =>
        new()
        {
            MessageType = messageType,
            Template = source,
            SendWithin = sendWithin,
            InputKeyByPlaceholder = new ReadOnlyDictionary<string, string>(
                new Dictionary<string, string>(aliases, StringComparer.Ordinal))
        };

    private static CatalogDescriptor GetDescriptor(EmailMessageType messageType) => messageType switch
    {
        EmailMessageType.KycApproved => Template(EmailTemplate.KycApproved, "Cadastro Aprovado - SwiftPay", TimeSpan.FromDays(7)),
        EmailMessageType.KycRejected => Template(EmailTemplate.KycRejected, "Cadastro Rejeitado - SwiftPay", TimeSpan.FromDays(7)),
        EmailMessageType.KycComplement => Template(EmailTemplate.KycComplement, "Complemento Solicitado - SwiftPay", TimeSpan.FromDays(7)),
        EmailMessageType.MerchantInactivated => Template(EmailTemplate.MerchantInactivated, "Sua organização foi inativada", TimeSpan.FromDays(7)),
        EmailMessageType.MerchantSuspended => Template(EmailTemplate.MerchantSuspended, "Sua organização foi suspensa", TimeSpan.FromDays(7)),
        EmailMessageType.AdminPasswordReset => Template(EmailTemplate.AdminPasswordReset, "Sua senha foi redefinida - SwiftPay", TimeSpan.FromHours(1)),
        EmailMessageType.EmailConfirmation => Template(EmailTemplate.EmailConfirmation, "Confirme seu e-mail - SwiftPay", TimeSpan.FromHours(24)),
        EmailMessageType.PasswordReset => Template(EmailTemplate.PasswordReset, "Redefina sua senha - SwiftPay", TimeSpan.FromHours(1)),
        EmailMessageType.DeviceVerification => Template(EmailTemplate.DeviceVerification, "Código de verificação de dispositivo - SwiftPay", TimeSpan.FromMinutes(10)),
        EmailMessageType.PasswordChanged => Template(EmailTemplate.PasswordChanged, "Sua senha foi alterada - SwiftPay", TimeSpan.FromDays(1)),
        EmailMessageType.AccountLocked => Template(EmailTemplate.AccountLocked, "Sua conta foi bloqueada - SwiftPay", TimeSpan.FromHours(1)),
        EmailMessageType.DeviceAdded => Template(EmailTemplate.DeviceAdded, "Novo dispositivo conectado à sua conta", TimeSpan.FromDays(1)),
        EmailMessageType.PayoutAccountActionVerification => Template(EmailTemplate.PayoutAccountActionVerification, "Verificação de conta de saque - SwiftPay", TimeSpan.FromMinutes(10)),
        EmailMessageType.PayoutAccountCreated => Template(EmailTemplate.PayoutAccountCreated, "Conta de saque ativada - SwiftPay", TimeSpan.FromDays(1)),
        EmailMessageType.MerchantDeleted => Template(EmailTemplate.MerchantDeleted, "Sua organização foi excluída - SwiftPay", TimeSpan.FromDays(7)),
        EmailMessageType.ApiCredentialCreated => Template(EmailTemplate.ApiCredentialCreated, "Nova credencial de API criada - SwiftPay", TimeSpan.FromDays(1)),
        EmailMessageType.ApiCredentialRevoked => Template(EmailTemplate.ApiCredentialRevoked, "Credencial de API revogada - SwiftPay", TimeSpan.FromDays(1)),
        EmailMessageType.ApiCredentialRegenerated => Template(EmailTemplate.ApiCredentialRegenerated, "Credencial de API regenerada - SwiftPay", TimeSpan.FromDays(1)),
        EmailMessageType.ApiCredentialCode => Template(EmailTemplate.ApiCredentialCode, "Confirmação de credencial de API - SwiftPay", TimeSpan.FromMinutes(10)),
        EmailMessageType.CustomHtml => new CatalogDescriptor(null, "", 1, TimeSpan.FromDays(1)),
        EmailMessageType.MerchantDeletionCode => Template(EmailTemplate.MerchantDeletionCode, "Código de confirmação para exclusão - SwiftPay", TimeSpan.FromMinutes(10)),
        EmailMessageType.KycSubmitted => Template(EmailTemplate.KycSubmitted, "Cadastro Recebido - SwiftPay", TimeSpan.FromDays(7)),
        EmailMessageType.PasswordChangeCode => Template(EmailTemplate.PasswordChangeCode, "Código de confirmação de alteração de senha - SwiftPay", TimeSpan.FromMinutes(10)),
        EmailMessageType.ReferralPayoutPixKeyVerification => Template(EmailTemplate.ReferralPayoutPixKeyVerification, "Código para confirmar chave PIX de indicação - SwiftPay", TimeSpan.FromMinutes(10)),
        EmailMessageType.PayoutCompleted => Template(EmailTemplate.PayoutCompleted, "Saque Concluído - SwiftPay", TimeSpan.FromDays(1)),
        EmailMessageType.PayoutRequested => Template(EmailTemplate.PayoutRequested, "Saque Solicitado - SwiftPay", TimeSpan.FromDays(1)),
        EmailMessageType.PayoutRejected => Template(EmailTemplate.PayoutRejected, "Saque Rejeitado - SwiftPay", TimeSpan.FromDays(1)),
        _ => throw new EmailIntentValidationException("The message type is not present in the typed template catalog.")
    };

    private static CatalogDescriptor Template(EmailTemplate template, string subject, TimeSpan sendWithin) =>
        new(template, subject, 1, sendWithin);

    private static NormalizedTemplate NormalizePlaceholders(
        string content,
        IReadOnlyDictionary<string, int>? initialCounts = null)
    {
        var counts = initialCounts is null
            ? new Dictionary<string, int>(StringComparer.Ordinal)
            : new Dictionary<string, int>(initialCounts, StringComparer.Ordinal);
        var aliases = new Dictionary<string, string>(StringComparer.Ordinal);
        var normalized = PlaceholderRegex.Replace(content, match =>
        {
            var inputKey = match.Groups[1].Value.ToUpperInvariant();
            counts.TryGetValue(inputKey, out var count);
            count++;
            counts[inputKey] = count;
            var alias = count == 1 ? inputKey : $"{inputKey}__{count}";
            aliases.Add(alias, inputKey);
            return $"[[{alias}]]";
        });

        return new NormalizedTemplate(normalized, aliases, counts);
    }

    private static string AdaptPasswordResetToActionLink(string html)
    {
        var occurrence = 0;
        return Regex.Replace(
            html,
            @"\[\[CODE\]\]",
            _ => ++occurrence == 1
                ? "<a href=\"[[RESET_PASSWORD_URL]]\" style=\"background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block; letter-spacing: normal;\">Redefinir senha</a>"
                : "Use o link seguro de redefinição enviado pela SwiftPay",
            RegexOptions.CultureInvariant);
    }

    private static string CreateTextFallback(string html)
    {
        var withoutActiveContent = StyleOrScriptRegex.Replace(html, " ");
        var withoutComments = CommentRegex.Replace(withoutActiveContent, " ");
        var withoutTags = TagRegex.Replace(withoutComments, " ");
        return WhitespaceRegex.Replace(WebUtility.HtmlDecode(withoutTags), " ").Trim();
    }

    private static EmailTemplateValueKind GetValueKind(string inputKey) => inputKey switch
    {
        "CONFIRMATION_URL" or "RESET_PASSWORD_URL" or "DASHBOARD_URL" or
        "COMPLEMENT_URL" or "ONBOARDING_URL" => EmailTemplateValueKind.Url,
        _ => EmailTemplateValueKind.Text
    };

    private static bool IsAuthActionLink(string inputKey, EmailMessageType messageType) =>
        (messageType == EmailMessageType.EmailConfirmation && inputKey == "CONFIRMATION_URL") ||
        (messageType == EmailMessageType.PasswordReset && inputKey == "RESET_PASSWORD_URL");

    private static Dictionary<string, string> NormalizeInputs(IReadOnlyDictionary<string, string> inputs)
    {
        var normalized = new Dictionary<string, string>(StringComparer.Ordinal);
        foreach (var pair in inputs)
        {
            var key = pair.Key.Trim().ToUpperInvariant();
            if (!normalized.TryAdd(key, pair.Value))
                throw new EmailIntentValidationException("Frozen Inputs contain duplicate placeholder names after normalization.");
        }

        return normalized;
    }

    private static EmailIntentValidationException Missing(string inputKey) =>
        new($"A value for the catalogued placeholder '{inputKey}' is required.");

    private sealed record CatalogDescriptor(
        EmailTemplate? LegacyTemplate,
        string Subject,
        int Version,
        TimeSpan SendWithin);

    private sealed record NormalizedTemplate(
        string Content,
        IReadOnlyDictionary<string, string> InputKeyByPlaceholder,
        IReadOnlyDictionary<string, int> Counts);
}
