using System.Text.Json;
using swiftpay_api_payment.Clients.Bankizi.Models;

namespace swiftpay_api_payment.Clients.Bankizi;

internal static class BankiziResponseParser
{
    public static string ParseBankiziError(string responseBody, JsonSerializerOptions jsonOptions)
    {
        try
        {
            var errorResponse = JsonSerializer.Deserialize<BankiziErrorResponse>(responseBody, jsonOptions);

            if (errorResponse != null)
            {
                var message = TranslateErrorMessage(errorResponse.Message);

                if (errorResponse.InvalidFields?.Count > 0)
                {
                    var fieldErrors = errorResponse.InvalidFields
                        .Select(f => TranslateFieldError(f.Field, f.Messages))
                        .Where(e => !string.IsNullOrEmpty(e));

                    var details = string.Join(". ", fieldErrors);
                    if (!string.IsNullOrEmpty(details))
                        return details;
                }

                return message ?? "Erro ao processar saque.";
            }
        }
        catch
        {
        }

        return "Erro ao processar saque. Tente novamente.";
    }

    private static string? TranslateErrorMessage(string? message)
    {
        if (string.IsNullOrEmpty(message))
            return null;

        return message switch
        {
            "The provided Pix key is not valid for type CPF" => "A chave PIX informada não é válida para o tipo CPF.",
            "The provided Pix key is not valid for type CNPJ" => "A chave PIX informada não é válida para o tipo CNPJ.",
            "The provided Pix key is not valid for type EMAIL" => "A chave PIX informada não é válida para o tipo E-mail.",
            "The provided Pix key is not valid for type PHONE" => "A chave PIX informada não é válida para o tipo Telefone.",
            "The provided Pix key is not valid" => "A chave PIX informada não é válida.",
            "There are invalid fields in the request" => "Dados inválidos na solicitação.",
            "Insufficient balance" => "Saldo insuficiente na adquirente.",
            "Pix key not found" => "Chave PIX não encontrada.",
            "Transaction already exists" => "Transação já existe.",
            _ => message.Contains("Pix key") ? "A chave PIX informada é inválida. Verifique os dados da conta de saque." : message
        };
    }

    private static string? TranslateFieldError(string? field, string? messages)
    {
        if (string.IsNullOrEmpty(field) || string.IsNullOrEmpty(messages))
            return null;

        return field.ToLowerInvariant() switch
        {
            "txid" => null,
            "pixkey" => "A chave PIX informada é inválida.",
            "amount" => "O valor informado é inválido.",
            _ => null
        };
    }
}
