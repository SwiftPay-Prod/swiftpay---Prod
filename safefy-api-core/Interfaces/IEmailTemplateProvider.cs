using safefy_api_core.Models.Email;

namespace safefy_api_core.Interfaces;

public interface IEmailTemplateProvider
{
    Task<string> GetTemplateContentAsync(EmailTemplate template);
}
