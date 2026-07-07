namespace swiftpay_api_core.Utils;

public static class MathUtils
{
    /// <summary>
    /// Calcula a porcentagem de um valor em relação ao total.
    /// Retorna 0 se o total for zero.
    /// </summary>
    /// <param name="value">Valor parcial</param>
    /// <param name="total">Valor total</param>
    /// <param name="decimals">Casas decimais (padrão: 2)</param>
    public static decimal CalculatePercentage(int value, int total, int decimals = 2)
    {
        if (total == 0) return 0;
        return Math.Round((decimal)value / total * 100, decimals);
    }

    /// <summary>
    /// Calcula a porcentagem de um valor em relação ao total.
    /// Retorna 0 se o total for zero.
    /// </summary>
    /// <param name="value">Valor parcial</param>
    /// <param name="total">Valor total</param>
    /// <param name="decimals">Casas decimais (padrão: 2)</param>
    public static decimal CalculatePercentage(long value, long total, int decimals = 2)
    {
        if (total == 0) return 0;
        return Math.Round((decimal)value / total * 100, decimals);
    }

    /// <summary>
    /// Calcula a porcentagem de um valor em relação ao total.
    /// Retorna 0 se o total for zero.
    /// </summary>
    /// <param name="value">Valor parcial</param>
    /// <param name="total">Valor total</param>
    /// <param name="decimals">Casas decimais (padrão: 2)</param>
    public static decimal CalculatePercentage(decimal value, decimal total, int decimals = 2)
    {
        if (total == 0) return 0;
        return Math.Round(value / total * 100, decimals);
    }
}
