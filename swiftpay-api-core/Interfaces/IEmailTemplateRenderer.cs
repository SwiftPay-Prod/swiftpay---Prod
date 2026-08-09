using swiftpay_api_core.Models.Email;

namespace swiftpay_api_core.Interfaces;

public interface IEmailTemplateRenderer
{
    RenderedEmailTemplate Render(
        EmailTemplateSource template,
        IEnumerable<EmailTemplateParameter> parameters,
        EmailUrlAllowlist urlAllowlist);
}
