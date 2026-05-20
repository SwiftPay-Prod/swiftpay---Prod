using safefy_api_core.Models.Email;

namespace safefy_api_core.Interfaces;

public interface IEmailService
{
    Task SendAsync(
        string to,
        string subject,
        EmailTemplate template,
        Dictionary<string, string> parameters,
        Guid? userId = null,
        Guid? merchantId = null);

    /// <summary>
    /// Sends an email with custom HTML content (for merchant-customized emails).
    /// </summary>
    Task SendHtmlAsync(
        string to,
        string subject,
        string htmlContent,
        Guid? userId = null,
        Guid? merchantId = null,
        string? templateName = null);
}
