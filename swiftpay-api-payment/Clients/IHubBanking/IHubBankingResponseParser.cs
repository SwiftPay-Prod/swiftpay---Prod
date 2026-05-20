using System.Text.Json;
using safefy_api_payment.Clients.IHubBanking.Models;

namespace safefy_api_payment.Clients.IHubBanking;

internal static class IHubBankingResponseParser
{
    public static string ParseIHubError(string responseBody, JsonSerializerOptions jsonOptions)
    {
        try
        {
            var errorResponse = JsonSerializer.Deserialize<IHubErrorResponse>(responseBody, jsonOptions);

            if (errorResponse != null)
                return TranslateErrorMessage(errorResponse.Message) ?? "Erro ao processar operação.";
        }
        catch
        {
        }

        return "Erro ao processar operação. Tente novamente.";
    }

    private static string? TranslateErrorMessage(string? message)
    {
        if (string.IsNullOrEmpty(message))
            return null;

        return message switch
        {
            "Sale value exceeds maximum" => "O valor da transação excede o limite máximo permitido.",
            "Sale value below minimum" => "O valor da transação está abaixo do mínimo permitido.",
            "Invalid amount" => "Valor inválido.",
            "Transaction not found" => "Transação não encontrada.",
            "Transaction already processed" => "Transação já processada.",
            "Transaction expired" => "Transação expirada.",
            "Unauthorized" => "Falha na autenticação com a adquirente.",
            "Invalid PIX key or account closed" => "Chave PIX inválida ou conta encerrada.",
            "Insufficient balance" => "Saldo insuficiente.",
            "Bad request - Invalid or missing required fields" => "Dados inválidos ou campos obrigatórios ausentes.",
            "Bad request - Invalid PIX key or insufficient balance" => "Chave PIX inválida ou saldo insuficiente.",
            _ => message.Contains("PIX") ? "A chave PIX informada é inválida. Verifique os dados."
                : message.Contains("maximum") ? "O valor excede o limite máximo permitido."
                : message.Contains("minimum") ? "O valor está abaixo do mínimo permitido."
                : message
        };
    }
}
