using System.Text.Json;

namespace safefy_api_payment.Services.Internal.Tracking;

internal static class TrackingMetadataReader
{
    public static Dictionary<string, JsonElement>? Parse(string? metadata)
    {
        if (string.IsNullOrWhiteSpace(metadata))
            return null;

        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(metadata);
        }
        catch
        {
            return null;
        }
    }

    public static string? ReadString(Dictionary<string, JsonElement>? metadata, string key)
    {
        if (metadata == null)
            return null;

        if (!metadata.TryGetValue(key, out var value))
            return null;

        return value.ValueKind switch
        {
            JsonValueKind.String => value.GetString(),
            JsonValueKind.Number => value.GetRawText(),
            JsonValueKind.True => "true",
            JsonValueKind.False => "false",
            _ => null
        };
    }

    public static string? ReadFirstString(Dictionary<string, JsonElement>? metadata, params string[] keys)
    {
        if (metadata == null || keys.Length == 0)
            return null;

        foreach (var key in keys)
        {
            var value = ReadString(metadata, key);
            if (!string.IsNullOrWhiteSpace(value))
                return value;
        }

        return null;
    }
}
