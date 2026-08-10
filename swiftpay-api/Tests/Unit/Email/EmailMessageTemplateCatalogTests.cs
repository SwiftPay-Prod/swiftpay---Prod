using FluentAssertions;
using Microsoft.Extensions.Options;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Settings;
using swiftpay_api_core.Services;

namespace swiftpay_api.Tests.Unit.Email;

public sealed class EmailMessageTemplateCatalogTests
{
    private readonly EmailMessageTemplateCatalog _catalog = new(new OutputTemplateProvider());
    private readonly EmailTemplateRenderer _renderer = new();

    [Fact]
    public async Task EveryMessageType_ShouldHaveAValidTypedTemplate()
    {
        foreach (var messageType in Enum.GetValues<EmailMessageType>())
        {
            var definition = await _catalog.GetDefinitionAsync(messageType);
            var values = CreateValues(definition);
            var bound = _catalog.Bind(definition, values);

            var rendered = _renderer.Render(
                bound.Definition.Template,
                bound.Parameters,
                new EmailUrlAllowlist([
                    "swiftpayment.info",
                    "swiftpay-878c0.firebaseapp.com",
                    "swiftpay-878c0.web.app"
                ]));

            rendered.Subject.Should().NotBeNullOrWhiteSpace();
            rendered.HtmlBody.Should().NotBeNullOrWhiteSpace();
            rendered.TextBody.Should().NotBeNullOrWhiteSpace();
            rendered.Version.Should().BeGreaterThan(0);
        }
    }

    [Fact]
    public async Task Bind_ShouldRejectMissingAndUnknownFrozenInputs()
    {
        var definition = await _catalog.GetDefinitionAsync(EmailMessageType.KycSubmitted);

        var missing = () => _catalog.Bind(definition, new EmailMessageTemplateValues());
        missing.Should().Throw<EmailIntentValidationException>();

        var unknown = () => _catalog.Bind(
            definition,
            new EmailMessageTemplateValues
            {
                Inputs = new Dictionary<string, string>
                {
                    ["NAME"] = "Taylor",
                    ["MERCHANT_NAME"] = "Swift Shop",
                    ["UNDECLARED"] = "drift"
                }
            });
        unknown.Should().Throw<EmailIntentValidationException>();
    }

    [Fact]
    public async Task CustomHtml_ShouldRequireExplicitTrustedValueAndUseTextFallback()
    {
        var definition = await _catalog.GetDefinitionAsync(EmailMessageType.CustomHtml);
        var trusted = TrustedEmailHtmlValue.FromTrustedSource(
            "<strong>Conteúdo aprovado</strong>",
            "Conteúdo aprovado");
        var bound = _catalog.Bind(
            definition,
            new EmailMessageTemplateValues
            {
                CustomSubject = "Teste SwiftPay",
                CustomBody = trusted
            });

        var rendered = _renderer.Render(
            bound.Definition.Template,
            bound.Parameters,
            new EmailUrlAllowlist(["swiftpayment.info"]));

        rendered.HtmlBody.Should().Be("<strong>Conteúdo aprovado</strong>");
        rendered.TextBody.Should().Be("Conteúdo aprovado");
    }

    private static EmailMessageTemplateValues CreateValues(EmailMessageTemplateDefinition definition)
    {
        if (definition.MessageType == EmailMessageType.CustomHtml)
        {
            return new EmailMessageTemplateValues
            {
                CustomSubject = "SwiftPay",
                CustomBody = TrustedEmailHtmlValue.FromTrustedSource("<p>Mensagem</p>", "Mensagem")
            };
        }

        var inputs = new Dictionary<string, string>(StringComparer.Ordinal);
        var isAuthMessage = definition.MessageType is EmailMessageType.EmailConfirmation or EmailMessageType.PasswordReset;
        foreach (var inputKey in definition.InputKeyByPlaceholder.Values.Distinct(StringComparer.Ordinal))
        {
            if (isAuthMessage && (inputKey is "CONFIRMATION_URL" or "RESET_PASSWORD_URL") ||
                inputKey == "EXPIRES_IN" &&
                definition.MessageType is EmailMessageType.EmailConfirmation or EmailMessageType.PasswordReset)
            {
                continue;
            }

            var kind = definition.Template.Placeholders
                .First(placeholder => definition.InputKeyByPlaceholder[placeholder.Name] == inputKey)
                .Kind;
            inputs[inputKey] = kind == EmailTemplateValueKind.Url
                ? "https://swiftpayment.info/panel"
                : "Valor seguro";
        }

        return new EmailMessageTemplateValues
        {
            Inputs = inputs,
            AuthActionLink = definition.MessageType is EmailMessageType.EmailConfirmation or EmailMessageType.PasswordReset
                ? "https://swiftpay-878c0.firebaseapp.com/__/auth/action?mode=test"
                : null
        };
    }

    private sealed class OutputTemplateProvider : IEmailTemplateProvider
    {
        public Task<string> GetTemplateContentAsync(EmailTemplate template)
        {
            var path = Path.Combine(
                AppContext.BaseDirectory,
                "Templates",
                "Email",
                EmailTemplates.GetTemplateName(template));
            return File.ReadAllTextAsync(path);
        }
    }
}
