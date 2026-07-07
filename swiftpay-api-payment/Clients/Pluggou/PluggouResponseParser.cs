using System.Text.Json;

namespace swiftpay_api_payment.Clients.Pluggou;

internal static class PluggouResponseParser
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

            if (root.TryGetProperty("error", out var error) && error.ValueKind == JsonValueKind.String)
            {
                return error.GetString() ?? "Erro ao processar requisicao.";
            }

            return "Erro ao processar requisicao.";
        }
        catch
        {
            return "Erro ao processar requisicao.";
        }
    }
}
