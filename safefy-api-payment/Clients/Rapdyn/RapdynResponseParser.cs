using System.Text.Json;

namespace safefy_api_payment.Clients.Rapdyn;

internal static class RapdynResponseParser
{
    public static string BuildErrorMessage(string responseBody)
    {
        if (string.IsNullOrWhiteSpace(responseBody))
            return "Erro ao processar requisicao.";

        try
        {
            using var doc = JsonDocument.Parse(responseBody);
            var root = doc.RootElement;

            if (root.TryGetProperty("message", out var message) && message.ValueKind == JsonValueKind.String)
            {
                return message.GetString() ?? "Erro ao processar requisicao.";
            }

            if (root.TryGetProperty("errors", out var errors) && errors.ValueKind == JsonValueKind.Object)
            {
                var error = ReadFirstError(errors);
                if (!string.IsNullOrEmpty(error))
                    return error;
            }

            var fallback = ReadFirstError(root);
            return string.IsNullOrEmpty(fallback) ? "Erro ao processar requisicao." : fallback;
        }
        catch
        {
            return "Erro ao processar requisicao.";
        }
    }

    private static string? ReadFirstError(JsonElement element)
    {
        foreach (var property in element.EnumerateObject())
        {
            if (property.Value.ValueKind == JsonValueKind.String)
                return property.Value.GetString();

            if (property.Value.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in property.Value.EnumerateArray())
                {
                    if (item.ValueKind == JsonValueKind.String)
                        return item.GetString();
                }
            }
        }

        return null;
    }
}
