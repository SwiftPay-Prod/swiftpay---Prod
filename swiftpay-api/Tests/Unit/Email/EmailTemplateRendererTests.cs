using FluentAssertions;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Services;

namespace swiftpay_api.Tests.Unit.Email;

public sealed class EmailTemplateRendererTests
{
    private static readonly EmailUrlAllowlist UrlAllowlist = new(["swiftpayment.info"]);
    private readonly EmailTemplateRenderer _renderer = new();

    [Fact]
    public void Render_ShouldHtmlEncodeHostileText_AndPreservePlainTextBody()
    {
        const string hostileText = "<script>alert('x')</script> & \"quoted\"";
        var template = Template(
            html: "<p>[[MESSAGE]]</p>",
            text: "[[MESSAGE]]",
            placeholders: [Placeholder("MESSAGE", EmailTemplateValueKind.Text)]);

        var result = _renderer.Render(
            template,
            [new EmailTemplateParameter("MESSAGE", new EmailTextValue(hostileText))],
            UrlAllowlist);

        result.HtmlBody.Should().NotContain(hostileText);
        result.HtmlBody.Should().Contain("&lt;script&gt;");
        result.HtmlBody.Should().Contain("&amp;");
        result.TextBody.Should().Be(hostileText);
    }

    [Theory]
    [InlineData("/verify?code=abc")]
    [InlineData("http://swiftpayment.info/verify?code=abc")]
    [InlineData("https://swiftpayment.info.evil.test/verify?code=abc")]
    [InlineData("https://user@swiftpayment.info/verify?code=abc")]
    public void Render_ShouldRejectInvalidOrNonAllowlistedUrl(string candidate)
    {
        var template = Template(
            html: "<a href=\"[[ACTION_URL]]\">Continuar</a>",
            text: "[[ACTION_URL]]",
            placeholders: [Placeholder("ACTION_URL", EmailTemplateValueKind.Url)]);

        var action = () => _renderer.Render(
            template,
            [new EmailTemplateParameter("ACTION_URL", EmailUrlValue.FromUntrusted(candidate))],
            UrlAllowlist);

        action.Should()
            .Throw<EmailTemplateRenderException>()
            .Which.Error.Should().Be(EmailTemplateRenderError.InvalidUrl);
    }

    [Fact]
    public void Render_ShouldAllowConfiguredHttpsUrl_AndEncodeItForHtml()
    {
        const string url = "https://swiftpayment.info/verify?first=1&second=2";
        var template = Template(
            html: "<a href=\"[[ACTION_URL]]\">Continuar</a>",
            text: "[[ACTION_URL]]",
            placeholders: [Placeholder("ACTION_URL", EmailTemplateValueKind.Url)]);

        var result = _renderer.Render(
            template,
            [new EmailTemplateParameter("ACTION_URL", EmailUrlValue.FromUntrusted(url))],
            UrlAllowlist);

        result.HtmlBody.Should().Contain("first=1&amp;second=2");
        result.TextBody.Should().Be(url);
    }

    [Fact]
    public void Render_ShouldInsertOnlyExplicitTrustedHtml_AndUseItsTextFallback()
    {
        var template = Template(
            html: "<section>[[DETAILS_HTML]]</section>",
            text: "Detalhes: [[DETAILS_HTML]]",
            placeholders: [Placeholder("DETAILS_HTML", EmailTemplateValueKind.TrustedHtml)]);
        var trustedHtml = TrustedEmailHtmlValue.FromTrustedSource(
            "<ul><li>Documento pendente</li></ul>",
            "Documento pendente");

        var result = _renderer.Render(
            template,
            [new EmailTemplateParameter("DETAILS_HTML", trustedHtml)],
            UrlAllowlist);

        result.HtmlBody.Should().Contain("<ul><li>Documento pendente</li></ul>");
        result.TextBody.Should().Be("Detalhes: Documento pendente");
        typeof(TrustedEmailHtmlValue).GetConstructors().Should().BeEmpty(
            "trusted HTML must be created through the explicitly named trusted-source API");
    }

    [Fact]
    public void Render_ShouldRejectTrustedHtmlInSubject()
    {
        var template = new EmailTemplateSource(
            "SecurityNotice",
            1,
            "[[TITLE_HTML]]",
            "<h1>[[TITLE_HTML]]</h1>",
            "Title",
            [Placeholder("TITLE_HTML", EmailTemplateValueKind.TrustedHtml)]);

        var action = () => _renderer.Render(
            template,
            [new EmailTemplateParameter(
                "TITLE_HTML",
                TrustedEmailHtmlValue.FromTrustedSource("<strong>Title</strong>", "Title"))],
            UrlAllowlist);

        action.Should()
            .Throw<EmailTemplateRenderException>()
            .Which.Error.Should().Be(EmailTemplateRenderError.TrustedHtmlNotAllowed);
    }

    [Fact]
    public void Render_ShouldRejectMissingPlaceholderBeforeReturningBodies()
    {
        var template = Template(
            html: "<p>[[NAME]]</p>",
            text: "[[NAME]]",
            placeholders: [Placeholder("NAME", EmailTemplateValueKind.Text)]);

        var action = () => _renderer.Render(template, [], UrlAllowlist);

        action.Should()
            .Throw<EmailTemplateRenderException>()
            .Which.Error.Should().Be(EmailTemplateRenderError.MissingPlaceholder);
    }

    [Fact]
    public void Render_ShouldRejectUnknownPlaceholderInTemplate()
    {
        var template = Template(
            html: "<p>[[UNDECLARED]]</p>",
            text: "No variables",
            placeholders: []);

        var action = () => _renderer.Render(template, [], UrlAllowlist);

        action.Should()
            .Throw<EmailTemplateRenderException>()
            .Which.Error.Should().Be(EmailTemplateRenderError.UnknownPlaceholder);
    }

    [Fact]
    public void Render_ShouldRejectUnknownSuppliedPlaceholder()
    {
        var template = Template(
            html: "<p>[[NAME]]</p>",
            text: "[[NAME]]",
            placeholders: [Placeholder("NAME", EmailTemplateValueKind.Text)]);

        var action = () => _renderer.Render(
            template,
            [
                new EmailTemplateParameter("NAME", new EmailTextValue("Maria")),
                new EmailTemplateParameter("UNDECLARED", new EmailTextValue("extra"))
            ],
            UrlAllowlist);

        action.Should()
            .Throw<EmailTemplateRenderException>()
            .Which.Error.Should().Be(EmailTemplateRenderError.UnknownPlaceholder);
    }

    [Fact]
    public void Render_ShouldRejectDuplicatePlaceholderOccurrence()
    {
        var template = Template(
            html: "<p>[[CODE]]</p><span>[[CODE]]</span>",
            text: "[[CODE]]",
            placeholders: [Placeholder("CODE", EmailTemplateValueKind.Text)]);

        var action = () => _renderer.Render(
            template,
            [new EmailTemplateParameter("CODE", new EmailTextValue("123456"))],
            UrlAllowlist);

        action.Should()
            .Throw<EmailTemplateRenderException>()
            .Which.Error.Should().Be(EmailTemplateRenderError.DuplicatePlaceholder);
    }

    [Fact]
    public void Render_ShouldRejectDuplicatePlaceholderBinding()
    {
        var template = Template(
            html: "<p>[[NAME]]</p>",
            text: "[[NAME]]",
            placeholders: [Placeholder("NAME", EmailTemplateValueKind.Text)]);

        var action = () => _renderer.Render(
            template,
            [
                new EmailTemplateParameter("NAME", new EmailTextValue("Maria")),
                new EmailTemplateParameter("NAME", new EmailTextValue("Outra"))
            ],
            UrlAllowlist);

        action.Should()
            .Throw<EmailTemplateRenderException>()
            .Which.Error.Should().Be(EmailTemplateRenderError.DuplicatePlaceholder);
    }

    [Fact]
    public void Render_ShouldProduceStableImmutableOutputForTheSameInputs()
    {
        var template = new EmailTemplateSource(
            "EmailConfirmation",
            3,
            "Confirme seu e-mail, [[NAME]]",
            "<p>Olá, [[NAME]]!</p><a href=\"[[ACTION_URL]]\">Confirmar</a>",
            "Olá, [[NAME]]! Confirme em [[ACTION_URL]]",
            [
                Placeholder("NAME", EmailTemplateValueKind.Text),
                Placeholder("ACTION_URL", EmailTemplateValueKind.Url)
            ]);
        EmailTemplateParameter[] parameters =
        [
            new("NAME", new EmailTextValue("Maria & João")),
            new("ACTION_URL", EmailUrlValue.FromUntrusted("https://swiftpayment.info/verify?code=abc"))
        ];

        var first = _renderer.Render(template, parameters, UrlAllowlist);
        var second = _renderer.Render(template, parameters.Reverse(), UrlAllowlist);

        second.Should().Be(first);
        first.TemplateName.Should().Be("EmailConfirmation");
        first.Version.Should().Be(3);
        typeof(RenderedEmailTemplate).GetProperties()
            .Should().OnlyContain(property => property.SetMethod == null);
    }

    private static EmailTemplateSource Template(
        string html,
        string text,
        IReadOnlyList<EmailTemplatePlaceholderDefinition> placeholders) =>
        new("TestTemplate", 1, "SwiftPay", html, text, placeholders);

    private static EmailTemplatePlaceholderDefinition Placeholder(
        string name,
        EmailTemplateValueKind kind) => new(name, kind);
}
