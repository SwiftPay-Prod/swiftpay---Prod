using System.Text.Json;
using safefy_api_core.Utils;
using safefy_api_payment.Interfaces;

namespace safefy_api_payment.Services.Acquirers.Utils;

public static class AcquirerApiLogUtils
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = false
    };

    private static readonly HashSet<string> SensitiveFields =
    [
        "secret",
        "token",
        "password",
        "authorization",
        "apiKey",
        "api_key",
        "pixKey",
        "pix_key",
        "document",
        "taxid",
        "tax_id",
        "cpf",
        "cnpj",
        "email",
        "phone",
        "cardnumber",
        "card_number",
        "cvv",
        "barcode",
        "digitableline",
        "digitable_line",
        "brcode",
        "copyandpaste",
        "copy_and_paste"
    ];

    public static string BuildRequestBody(AcquirerConfig config, string operation, object? requestPayload)
    {
        return BuildRequestBody(
            config.AcquirerId,
            config.AcquirerType.ToString(),
            config.Credentials.Keys,
            operation,
            requestPayload);
    }

    public static string BuildRequestBody(
        Guid acquirerId,
        string acquirerType,
        IEnumerable<string> credentialKeys,
        string operation,
        object? requestPayload)
    {
        var payload = new
        {
            operation,
            acquirerId,
            acquirerType,
            credentialKeys = credentialKeys.OrderBy(x => x).ToArray(),
            request = Sanitize(requestPayload)
        };

        return JsonSerializer.Serialize(payload, JsonOptions);
    }

    private static object? Sanitize(object? value)
    {
        if (value == null)
            return null;

        var json = JsonSerializer.Serialize(value, JsonOptions);
        using var document = JsonDocument.Parse(json);
        return SanitizeElement(document.RootElement, null);
    }

    private static object? SanitizeElement(JsonElement element, string? propertyName)
    {
        if (!string.IsNullOrWhiteSpace(propertyName) && IsSensitive(propertyName))
        {
            if (element.ValueKind == JsonValueKind.String)
            {
                return MaskSensitiveValue(propertyName, element.GetString());
            }

            return "***";
        }

        return element.ValueKind switch
        {
            JsonValueKind.Object => element.EnumerateObject().ToDictionary(
                x => x.Name,
                x => SanitizeElement(x.Value, x.Name)),
            JsonValueKind.Array => element.EnumerateArray().Select(x => SanitizeElement(x, propertyName)).ToList(),
            JsonValueKind.String => element.GetString(),
            JsonValueKind.Number => element.TryGetInt64(out var l) ? l : element.GetDecimal(),
            JsonValueKind.True => true,
            JsonValueKind.False => false,
            _ => null
        };
    }

    private static bool IsSensitive(string propertyName)
    {
        return SensitiveFields.Any(sensitive => propertyName.Contains(sensitive, StringComparison.OrdinalIgnoreCase));
    }

    private static string MaskString(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return "***";

        if (value.Length <= 4)
            return "***";

        return $"{value[..2]}***{value[^2..]}";
    }

    private static string MaskSensitiveValue(string propertyName, string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return "***";

        var normalized = propertyName.Trim().ToLowerInvariant();

        if (normalized.Contains("email"))
            return MaskUtils.MaskEmail(value);

        if (normalized.Contains("phone"))
            return MaskUtils.MaskPhone(value);

        if (normalized.Contains("pixkey") || normalized.Contains("pix_key"))
            return MaskUtils.MaskPixKey(value);

        if (normalized.Contains("document")
            || normalized.Contains("taxid")
            || normalized.Contains("tax_id")
            || normalized.Contains("cpf")
            || normalized.Contains("cnpj"))
            return MaskUtils.MaskDocument(value);

        if (normalized.Contains("barcode")
            || normalized.Contains("digitableline")
            || normalized.Contains("digitable_line")
            || normalized.Contains("brcode")
            || normalized.Contains("copyandpaste")
            || normalized.Contains("copy_and_paste"))
            return MaskUtils.MaskGeneric(value);

        return MaskString(value);
    }
}