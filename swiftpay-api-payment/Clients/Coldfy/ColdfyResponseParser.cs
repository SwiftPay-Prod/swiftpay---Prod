using System.Text.Json;
using swiftpay_api_payment.Clients.Coldfy.Models.Payments;
using swiftpay_api_payment.Clients.Coldfy.Models.Withdrawals;

namespace swiftpay_api_payment.Clients.Coldfy;

internal static class ColdfyResponseParser
{
    public static (string? ErrorCode, string? ErrorMessage) TryGetPaymentError(string responseBody, JsonSerializerOptions readOptions)
    {
        try
        {
            var error = JsonSerializer.Deserialize<ColdfyPaymentErrorResponse>(responseBody, readOptions);
            if (error?.Error?.Details?.Count > 0)
            {
                return (error.Error.Code, $"{error.Error.Message} ({string.Join(", ", error.Error.Details)})");
            }

            return (error?.Error?.Code, error?.Error?.Message);
        }
        catch
        {
            return (null, null);
        }
    }

    public static (string? ErrorCode, string? ErrorMessage) TryGetWithdrawalError(string responseBody, JsonSerializerOptions readOptions)
    {
        try
        {
            var error = JsonSerializer.Deserialize<ColdfyWithdrawalErrorResponse>(responseBody, readOptions);
            return (error?.Error?.Code?.ToString(), error?.Error?.Message);
        }
        catch
        {
            return (null, null);
        }
    }

    public static ColdfyWithdrawalResponse? TryParseWithdrawalResponseResilient(string responseBody)
    {
        try
        {
            using var document = JsonDocument.Parse(responseBody);
            var root = document.RootElement;

            var eventName = TryGetString(root, "event");
            var timestamp = TryGetDateTime(root, "timestamp");

            ColdfyWithdrawal? withdrawal = null;
            if (root.TryGetProperty("withdrawal", out var withdrawalElement) && withdrawalElement.ValueKind == JsonValueKind.Object)
            {
                var withdrawalId = TryGetString(withdrawalElement, "id");
                var statusRaw = TryGetString(withdrawalElement, "status");

                withdrawal = new ColdfyWithdrawal
                {
                    Id = withdrawalId,
                    Status = ParseWithdrawalStatus(statusRaw)
                };
            }

            return new ColdfyWithdrawalResponse
            {
                Event = eventName,
                Timestamp = timestamp,
                Withdrawal = withdrawal
            };
        }
        catch
        {
            return null;
        }
    }

    private static string? TryGetString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out var valueElement))
            return null;

        return valueElement.ValueKind switch
        {
            JsonValueKind.String => valueElement.GetString(),
            JsonValueKind.Number => valueElement.GetRawText(),
            JsonValueKind.True => bool.TrueString,
            JsonValueKind.False => bool.FalseString,
            _ => null
        };
    }

    private static DateTime? TryGetDateTime(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out var valueElement))
            return null;

        if (valueElement.ValueKind != JsonValueKind.String)
            return null;

        var value = valueElement.GetString();
        if (string.IsNullOrWhiteSpace(value))
            return null;

        return DateTime.TryParse(value, out var parsedDate) ? parsedDate : null;
    }

    private static ColdfyWithdrawalStatus? ParseWithdrawalStatus(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        return value.Trim().ToLowerInvariant() switch
        {
            "pending" => ColdfyWithdrawalStatus.Pending,
            "approved" => ColdfyWithdrawalStatus.Approved,
            "paid" => ColdfyWithdrawalStatus.Paid,
            "failed" => ColdfyWithdrawalStatus.Failed,
            "canceled" => ColdfyWithdrawalStatus.Canceled,
            "cancelled" => ColdfyWithdrawalStatus.Canceled,
            _ => null
        };
    }
}
