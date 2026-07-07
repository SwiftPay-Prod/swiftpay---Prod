using swiftpay_api_core.Models.Inputs;

namespace swiftpay_api_core.Interfaces;

public interface IEmailLogService
{
    Task LogAsync(EmailLogInput input);

    Task LogSuccessAsync(
        string to,
        string subject,
        string template,
        Dictionary<string, string>? parameters = null,
        Guid? userId = null,
        Guid? merchantId = null,
        long? sendTimeMs = null);

    Task LogFailureAsync(
        string to,
        string subject,
        string template,
        string errorMessage,
        Dictionary<string, string>? parameters = null,
        Guid? userId = null,
        Guid? merchantId = null,
        long? sendTimeMs = null);

    Task LogSkippedAsync(
        string to,
        string subject,
        string template,
        Dictionary<string, string>? parameters = null,
        Guid? userId = null,
        Guid? merchantId = null);
}
