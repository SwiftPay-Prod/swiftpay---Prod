using swiftpay_api_core.Models.Email;

namespace swiftpay_api_core.Interfaces;

public interface IEmailTemplateProvider
{
    Task<string> GetTemplateContentAsync(EmailTemplate template);
}
