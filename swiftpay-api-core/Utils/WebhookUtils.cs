namespace swiftpay_api_core.Utils;

public static class WebhookUtils
{
    public static string? BuildWebhookUrl(string? baseUrl, string path)
    {
        if (string.IsNullOrEmpty(baseUrl))
        {
            return null;
        }

        if (baseUrl.Contains("localhost", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        return $"{baseUrl.TrimEnd('/')}{path}";
    }

    public static string? BuildWebhookUrl(string? baseUrl, string path, string? token)
    {
        if (string.IsNullOrEmpty(baseUrl))
        {
            return null;
        }

        if (baseUrl.Contains("localhost", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        var url = $"{baseUrl.TrimEnd('/')}{path}";

        if (!string.IsNullOrEmpty(token))
        {
            var escapedToken = Uri.EscapeDataString(token);
            url = $"{url}?token={escapedToken}";
        }

        return url;
    }
}
