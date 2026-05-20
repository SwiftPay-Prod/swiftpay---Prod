using Microsoft.Extensions.Logging;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Inputs;
using System.Text.Json;

namespace safefy_api_core.Services;

public class ApiLogService : IApiLogService
{
    private readonly ILogQueue<ApiLogEntry> _logQueue;
    private readonly ILogger<ApiLogService> _logger;

    private Guid _merchantId;
    private string? _merchantName;
    private string? _merchantDocument;
    private Guid? _credentialId;
    private string? _ipAddress;
    private string? _userAgent;
    private string? _location;
    private string? _httpMethod;
    private string? _endpoint;
    private long? _responseTimeMs;
    private int? _statusCode;

    public ApiLogService(
        ILogQueue<ApiLogEntry> logQueue,
        ILogger<ApiLogService> logger
    )
    {
        _logQueue = logQueue;
        _logger = logger;
    }

    public void SetContext(Guid merchantId, Guid? credentialId, string? ipAddress, string? userAgent, string? location = null)
    {
        _merchantId = merchantId;
        _merchantName = null;
        _merchantDocument = null;
        _credentialId = credentialId;
        _ipAddress = ipAddress;
        _userAgent = userAgent;
        _location = location;
    }

    public void SetContext(Guid merchantId, string? merchantName, string? merchantDocument, Guid? credentialId, string? ipAddress, string? userAgent, string? location = null)
    {
        _merchantId = merchantId;
        _merchantName = merchantName;
        _merchantDocument = merchantDocument;
        _credentialId = credentialId;
        _ipAddress = ipAddress;
        _userAgent = userAgent;
        _location = location;
    }

    public void SetEndpoint(string httpMethod, string endpoint)
    {
        _httpMethod = httpMethod;
        _endpoint = endpoint;
    }

    public void SetResponseTime(long responseTimeMs)
    {
        _responseTimeMs = responseTimeMs;
    }

    public void SetStatusCode(int statusCode)
    {
        _statusCode = statusCode;
    }

    public async Task LogAsync(ApiLogInput input)
    {
        var merchantId = input.MerchantId ?? (_merchantId != Guid.Empty ? _merchantId : Guid.Empty);

        if (merchantId == Guid.Empty && !IsPlatformAction(input.Action))
            return;

        try
        {
            var ipAddress = input.IpAddress ?? _ipAddress;
            var userAgent = input.UserAgent ?? _userAgent;
            var location = input.Location ?? _location;

            if (input.Action == ApiLogAction.AcquirerRequestFailed)
            {
                ipAddress ??= "background";
                userAgent ??= "MassTransit/BackgroundWorker";
                location ??= "N/A";
            }

            var log = new ApiLogEntry
            {
                Id = Guid.CreateVersion7(),
                MerchantId = merchantId,
                MerchantName = input.MerchantName ?? _merchantName,
                MerchantDocument = input.MerchantDocument ?? _merchantDocument,
                CredentialId = input.CredentialId ?? _credentialId,
                HttpMethod = _httpMethod ?? input.HttpMethod ?? "UNKNOWN",
                Endpoint = _endpoint ?? input.Endpoint ?? "/unknown",
                StatusCode = _statusCode ?? input.StatusCode,
                Action = input.Action.ToString(),
                Status = input.Status.ToString(),
                IpAddress = ipAddress,
                UserAgent = userAgent,
                Location = location,
                ResourceId = input.ResourceId,
                ResourceType = input.ResourceType,
                Details = ResolveDetails(input),
                ErrorCode = input.ErrorCode,
                RequestBody = input.RequestBody,
                ResponseBody = input.ResponseBody,
                AcquirerId = input.AcquirerId,
                AcquirerType = input.AcquirerType,
                ResponseTimeMs = input.ResponseTimeMs ?? _responseTimeMs,
                CreatedAt = DateTime.UtcNow
            };

            await _logQueue.EnqueueAsync(log);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to enqueue API log: Action={Action}, Status={Status}, MerchantId={MerchantId}",
                input.Action, input.Status, _merchantId);
        }
    }

    private static bool IsPlatformAction(ApiLogAction action)
    {
        return action is ApiLogAction.CreatePlatformPayout
            or ApiLogAction.CancelPlatformPayout
            or ApiLogAction.ReprocessPlatformPayout
            or ApiLogAction.CreateSimulatedPlatformPayout;
    }

    private static string? ResolveDetails(ApiLogInput input)
    {
        if (!string.IsNullOrWhiteSpace(input.Details))
            return input.Details;

        if (!string.IsNullOrWhiteSpace(input.ErrorCode))
            return $"ErrorCode: {input.ErrorCode}";

        var message = TryExtractErrorMessage(input.ResponseBody);
        if (!string.IsNullOrWhiteSpace(message))
            return message;

        return null;
    }

    private static string? TryExtractErrorMessage(string? responseBody)
    {
        if (string.IsNullOrWhiteSpace(responseBody))
            return null;

        try
        {
            using var document = JsonDocument.Parse(responseBody);
            var root = document.RootElement;

            if (root.TryGetProperty("message", out var messageElement)
                && messageElement.ValueKind == JsonValueKind.String)
            {
                return messageElement.GetString();
            }

            if (root.TryGetProperty("error", out var errorElement)
                && errorElement.ValueKind == JsonValueKind.Object
                && errorElement.TryGetProperty("message", out var errorMessage)
                && errorMessage.ValueKind == JsonValueKind.String)
            {
                return errorMessage.GetString();
            }

            if (root.TryGetProperty("errors", out var errorsElement)
                && errorsElement.ValueKind == JsonValueKind.Object)
            {
                foreach (var property in errorsElement.EnumerateObject())
                {
                    if (property.Value.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var item in property.Value.EnumerateArray())
                        {
                            if (item.ValueKind == JsonValueKind.String)
                                return item.GetString();
                        }
                    }

                    if (property.Value.ValueKind == JsonValueKind.String)
                        return property.Value.GetString();
                }
            }
        }
        catch
        {
            return null;
        }

        return null;
    }
}
