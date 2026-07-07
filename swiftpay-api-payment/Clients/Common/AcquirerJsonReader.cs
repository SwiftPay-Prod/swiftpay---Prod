using System.Text.Json;

namespace swiftpay_api_payment.Clients.Common;

public static class AcquirerJsonReader
{
    public static JsonElement ExtractPayload(JsonElement root, params string[] keys)
    {
        foreach (var key in keys)
        {
            if (root.ValueKind == JsonValueKind.Object
                && TryGetPropertyInsensitive(root, key, out var value)
                && value.ValueKind == JsonValueKind.Object)
            {
                return value;
            }
        }

        return root;
    }

    public static string? ReadString(JsonElement source, params string[] keys)
    {
        if (source.ValueKind != JsonValueKind.Object)
            return null;

        foreach (var key in keys)
        {
            if (!TryGetPropertyInsensitive(source, key, out var value))
                continue;

            if (value.ValueKind == JsonValueKind.String)
                return value.GetString();

            if (value.ValueKind is JsonValueKind.Number or JsonValueKind.True or JsonValueKind.False)
                return value.ToString();
        }

        return null;
    }

    public static string? ReadDocument(JsonElement source, params string[] keys)
    {
        if (source.ValueKind != JsonValueKind.Object)
            return null;

        foreach (var key in keys)
        {
            if (!TryGetPropertyInsensitive(source, key, out var value))
                continue;

            var document = ReadDocumentValue(value);
            if (!string.IsNullOrWhiteSpace(document))
                return document;
        }

        return null;
    }

    public static DateTime? ReadDateTime(JsonElement source, params string[] keys)
    {
        var value = ReadString(source, keys);
        if (string.IsNullOrWhiteSpace(value))
            return null;

        return DateTime.TryParse(value, out var parsed) ? parsed : null;
    }

    public static bool TryGetPropertyInsensitive(JsonElement source, string key, out JsonElement value)
    {
        if (source.TryGetProperty(key, out value))
            return true;

        foreach (var property in source.EnumerateObject())
        {
            if (string.Equals(property.Name, key, StringComparison.OrdinalIgnoreCase))
            {
                value = property.Value;
                return true;
            }
        }

        value = default;
        return false;
    }

    public static bool TryParseJson(string? value, out JsonDocument document)
    {
        try
        {
            document = JsonDocument.Parse(value ?? "{}");
            return true;
        }
        catch
        {
            document = null!;
            return false;
        }
    }

    private static string? ReadDocumentValue(JsonElement value)
    {
        if (value.ValueKind == JsonValueKind.String)
            return value.GetString();

        if (value.ValueKind is JsonValueKind.Number or JsonValueKind.True or JsonValueKind.False)
            return value.ToString();

        if (value.ValueKind != JsonValueKind.Object)
            return null;

        return ReadString(value, "number", "value", "taxID", "taxId", "document", "documentNumber", "cpfCnpj", "cpf", "cnpj");
    }
}
