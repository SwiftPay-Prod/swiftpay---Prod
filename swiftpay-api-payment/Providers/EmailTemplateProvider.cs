using safefy_api_core.Interfaces;
using safefy_api_core.Models.Email;

namespace safefy_api_payment.Providers;

public class EmailTemplateProvider(IWebHostEnvironment environment) : IEmailTemplateProvider
{
    public async Task<string> GetTemplateContentAsync(EmailTemplate template)
    {
        var templateName = EmailTemplates.GetTemplateName(template);
        var templatePath = Path.Combine(environment.ContentRootPath, "Templates", "Email", templateName);
        return await File.ReadAllTextAsync(templatePath);
    }
}
