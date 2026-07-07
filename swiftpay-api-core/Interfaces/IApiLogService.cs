using swiftpay_api_core.Models.Inputs;

namespace swiftpay_api_core.Interfaces;

public interface IApiLogService
{
    Task LogAsync(ApiLogInput input);

    void SetContext(Guid merchantId, Guid? credentialId, string? ipAddress, string? userAgent, string? location = null);

    void SetContext(Guid merchantId, string? merchantName, string? merchantDocument, Guid? credentialId, string? ipAddress, string? userAgent, string? location = null);

    void SetEndpoint(string httpMethod, string endpoint);

    void SetResponseTime(long responseTimeMs);

    void SetStatusCode(int statusCode);
}
