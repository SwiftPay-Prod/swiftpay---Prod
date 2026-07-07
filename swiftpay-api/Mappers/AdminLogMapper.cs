using swiftpay_api.Endpoints.Admin.Logs.ReadListLogs;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Mappers;

public static class AdminLogMapper
{
    public static AdminLogEntryData ToAcquirerWebhookData(
        AcquirerWebhookLogEntry entry,
        string? acquirerDisplayName,
        string? acquirerLogoUrl)
    {
        return new AdminLogEntryData
        {
            Id = entry.Id,
            LogType = AdminLogType.AcquirerWebhook,
            AcquirerId = entry.AcquirerId,
            AcquirerType = entry.AcquirerType,
            AcquirerCode = entry.AcquirerCode,
            AcquirerDisplayName = acquirerDisplayName,
            AcquirerLogoUrl = acquirerLogoUrl,
            HttpMethod = entry.HttpMethod,
            Endpoint = entry.Endpoint,
            QueryString = entry.QueryString,
            RequestHeaders = entry.RequestHeaders,
            RequestBody = entry.RequestBody,
            IpAddress = entry.IpAddress,
            UserAgent = entry.UserAgent,
            Location = entry.Location,
            CorrelationId = entry.CorrelationId,
            ContentType = entry.ContentType,
            ContentLength = entry.ContentLength,
            StatusCode = entry.StatusCode,
            CreatedAt = entry.CreatedAt
        };
    }

    public static AdminLogEntryData ToApiData(ApiLogEntry entry, string? merchantName, string? merchantDocument)
    {
        return new AdminLogEntryData
        {
            Id = entry.Id,
            LogType = AdminLogType.Api,
            Action = entry.Action,
            Status = entry.Status,
            StatusCode = entry.StatusCode,
            MerchantId = entry.MerchantId,
            MerchantName = merchantName ?? entry.MerchantName,
            MerchantDocument = merchantDocument ?? entry.MerchantDocument,
            CredentialId = entry.CredentialId,
            AcquirerId = entry.AcquirerId,
            AcquirerType = entry.AcquirerType,
            HttpMethod = entry.HttpMethod,
            Endpoint = entry.Endpoint,
            ErrorCode = entry.ErrorCode,
            Details = entry.Details,
            RequestBody = entry.RequestBody,
            ResponseBody = entry.ResponseBody,
            ResourceId = entry.ResourceId,
            ResourceType = entry.ResourceType?.ToString(),
            ResponseTimeMs = entry.ResponseTimeMs,
            IpAddress = entry.IpAddress,
            UserAgent = entry.UserAgent,
            Location = entry.Location,
            CreatedAt = entry.CreatedAt
        };
    }

    public static AdminLogEntryData ToSecurityData(SecurityLogEntry entry)
    {
        return new AdminLogEntryData
        {
            Id = entry.Id,
            LogType = AdminLogType.Security,
            Action = entry.Action.ToString(),
            Status = entry.Status.ToString(),
            UserId = entry.UserId,
            UserEmail = entry.UserEmail,
            Details = entry.Details,
            IpAddress = entry.IpAddress,
            UserAgent = entry.UserAgent,
            Location = entry.Location,
            ServiceName = entry.ServiceName,
            CreatedAt = entry.CreatedAt
        };
    }

    public static AdminLogEntryData ToEmailData(EmailLogEntry entry, string? merchantName, string? merchantDocument)
    {
        return new AdminLogEntryData
        {
            Id = entry.Id,
            LogType = AdminLogType.Email,
            Status = entry.Status,
            MerchantId = entry.MerchantId,
            MerchantName = merchantName,
            MerchantDocument = merchantDocument,
            UserId = entry.UserId,
            EmailTo = entry.To,
            EmailSubject = entry.Subject,
            EmailTemplate = entry.Template,
            EmailStatus = entry.Status,
            EmailParameters = entry.Parameters,
            EmailErrorMessage = entry.ErrorMessage,
            EmailSendTimeMs = entry.SendTimeMs,
            ServiceName = entry.ServiceName,
            IpAddress = entry.IpAddress,
            Details = entry.ErrorMessage,
            CreatedAt = entry.CreatedAt
        };
    }
}
