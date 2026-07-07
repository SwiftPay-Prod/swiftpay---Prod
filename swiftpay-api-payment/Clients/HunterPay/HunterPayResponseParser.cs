using System.Text.Json;

namespace swiftpay_api_payment.Clients.HunterPay;

internal static class HunterPayResponseParser
{
    public static string BuildErrorMessage(string responseBody)
    {
        if (string.IsNullOrWhiteSpace(responseBody))
            return "Erro ao processar requisicao.";

        try
        {
            using var doc = JsonDocument.Parse(responseBody);
            var root = doc.RootElement;

            if (root.TryGetProperty("error", out var errorObject) && errorObject.ValueKind == JsonValueKind.Object)
            {
                var nestedErrorMessage = errorObject.TryGetProperty("message", out var nestedMessage) && nestedMessage.ValueKind == JsonValueKind.String
                    ? nestedMessage.GetString()
                    : null;

                if (errorObject.TryGetProperty("details", out var details) && details.ValueKind == JsonValueKind.Array)
                {
                    var detailValues = details.EnumerateArray()
                        .Where(item => item.ValueKind == JsonValueKind.String)
                        .Select(item => item.GetString())
                        .Where(item => !string.IsNullOrWhiteSpace(item))
                        .ToArray();

                    if (!string.IsNullOrWhiteSpace(nestedErrorMessage) && detailValues.Length > 0)
                        return $"{nestedErrorMessage}: {string.Join("; ", detailValues!)}";
                }

                if (!string.IsNullOrWhiteSpace(nestedErrorMessage))
                    return nestedErrorMessage;
            }

            if (root.TryGetProperty("message", out var message) && message.ValueKind == JsonValueKind.String)
                return message.GetString() ?? "Erro ao processar requisicao.";

            if (root.TryGetProperty("error", out var error) && error.ValueKind == JsonValueKind.String)
                return error.GetString() ?? "Erro ao processar requisicao.";

            return "Erro ao processar requisicao.";
        }
        catch
        {
            return "Erro ao processar requisicao.";
        }
    }

    public static string? ExtractErrorCode(string responseBody)
    {
        if (string.IsNullOrWhiteSpace(responseBody))
            return null;

        try
        {
            using var doc = JsonDocument.Parse(responseBody);
            var root = doc.RootElement;

            if (root.TryGetProperty("error", out var errorObject) && errorObject.ValueKind == JsonValueKind.Object)
            {
                if (errorObject.TryGetProperty("code", out var nestedCode))
                    return nestedCode.ToString();
            }

            if (root.TryGetProperty("code", out var code))
                return code.ToString();

            return null;
        }
        catch
        {
            return null;
        }
    }
}
