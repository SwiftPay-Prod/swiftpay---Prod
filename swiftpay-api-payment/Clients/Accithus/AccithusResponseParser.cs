using System.Text.Json;
using swiftpay_api_payment.Clients.Common;
using swiftpay_api_payment.Clients.Accithus.Models;

namespace swiftpay_api_payment.Clients.Accithus;

internal static class AccithusResponseParser
{
    public static string ParseErrorMessage(string responseBody, JsonSerializerOptions jsonOptions)
    {
        if (string.IsNullOrWhiteSpace(responseBody))
            return "Empty error response";

        try
        {
            var errorResponse = JsonSerializer.Deserialize<AccithusApiResponse<object>>(responseBody, jsonOptions);
            if (!string.IsNullOrWhiteSpace(errorResponse?.Error?.Message))
                return errorResponse.Error.Message;

            if (!string.IsNullOrWhiteSpace(errorResponse?.Message))
                return errorResponse.Message;
        }
        catch
        {
        }

        if (AcquirerJsonReader.TryParseJson(responseBody, out var document))
        {
            using (document)
            {
                var root = document.RootElement;

                var rootMessage = AcquirerJsonReader.ReadString(root, "message", "detail", "error_description");
                var detailsMessage = ExtractValidationDetailsMessage(root);

                if (!string.IsNullOrWhiteSpace(rootMessage) && !string.IsNullOrWhiteSpace(detailsMessage))
                    return $"{rootMessage}: {detailsMessage}";

                if (!string.IsNullOrWhiteSpace(detailsMessage))
                    return detailsMessage;

                if (!string.IsNullOrWhiteSpace(rootMessage))
                    return rootMessage;

                if (AcquirerJsonReader.TryGetPropertyInsensitive(root, "error", out var errorNode))
                {
                    var nestedMessage = AcquirerJsonReader.ReadString(errorNode, "message", "detail", "description");
                    if (!string.IsNullOrWhiteSpace(nestedMessage))
                        return nestedMessage;
                }
            }
        }

        return BuildRawErrorMessage(responseBody);
    }

    private static string? ExtractValidationDetailsMessage(JsonElement root)
    {
        if (!AcquirerJsonReader.TryGetPropertyInsensitive(root, "details", out var details)
            || details.ValueKind != JsonValueKind.Array)
            return null;

        foreach (var item in details.EnumerateArray())
        {
            var path = AcquirerJsonReader.ReadString(item, "path");
            var message = AcquirerJsonReader.ReadString(item, "message", "detail", "description");

            if (string.IsNullOrWhiteSpace(message))
                continue;

            if (string.IsNullOrWhiteSpace(path))
                return message;

            return $"{path}: {message}";
        }

        return null;
    }

    private static string BuildRawErrorMessage(string responseBody)
    {
        const int maxLength = 512;
        var sanitized = responseBody.Trim();

        if (sanitized.Length > maxLength)
            sanitized = sanitized[..maxLength];

        return $"Accithus error response: {sanitized}";
    }
}
