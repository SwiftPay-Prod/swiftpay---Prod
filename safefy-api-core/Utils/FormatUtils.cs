using System.Globalization;
using safefy_api_core.Models.Database;

namespace safefy_api_core.Utils;

public static class FormatUtils
{
    private static readonly CultureInfo PtBrCulture = new("pt-BR");

    public static string FormatCurrency(long amountInCents)
    {
        return (amountInCents / 100m).ToString("C", PtBrCulture);
    }

    public static string FormatCurrencyNumber(long amountInCents)
    {
        return (amountInCents / 100m).ToString("N2", PtBrCulture);
    }

    public static string FormatPaymentMethod(string method)
    {
        return method switch
        {
            "Pix" => "PIX",
            "CreditCard" => "Cartão de Crédito",
            "Boleto" => "Boleto",
            _ => method
        };
    }

    public static DateTime GetBrazilTime()
    {
        var brazilTimeZone = TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time");
        return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, brazilTimeZone);
    }

    public static string GetPixKeyTypeDisplayName(PixKeyType keyType) => keyType switch
    {
        PixKeyType.Cpf => "CPF",
        PixKeyType.Cnpj => "CNPJ",
        PixKeyType.Email => "E-mail",
        PixKeyType.Phone => "Telefone",
        PixKeyType.Random => "Chave Aleatória",
        _ => keyType.ToString()
    };
}
