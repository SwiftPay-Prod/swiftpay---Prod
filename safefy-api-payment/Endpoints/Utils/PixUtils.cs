using System.Security.Cryptography;

namespace safefy_api_payment.Endpoints.Utils;

/// <summary>
/// Utilitários para operações relacionadas ao PIX.
/// </summary>
public static class PixUtils
{
    private const string TxIdChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private const int TxIdLength = 26;

    /// <summary>
    /// Gera um TxId único para transações PIX.
    /// O TxId segue o padrão do BACEN: 26 caracteres alfanuméricos (A-Z, 0-9).
    /// </summary>
    /// <returns>TxId de 26 caracteres.</returns>
    public static string GenerateTxId()
    {
        return RandomNumberGenerator.GetString(TxIdChars, TxIdLength);
    }

    /// <summary>
    /// Valida se um TxId está no formato correto.
    /// </summary>
    /// <param name="txId">TxId a ser validado.</param>
    /// <returns>True se o TxId for válido.</returns>
    public static bool IsValidTxId(string? txId)
    {
        if (string.IsNullOrEmpty(txId) || txId.Length != TxIdLength)
            return false;

        foreach (var c in txId)
        {
            if (!TxIdChars.Contains(c))
                return false;
        }

        return true;
    }

    /// <summary>
    /// Valida se um EndToEndId está no formato correto.
    /// O EndToEndId segue o padrão: E + 8 dígitos (ISPB) + data (AAAAMMDDHHmm) + 11 caracteres alfanuméricos.
    /// Exemplo: E00000000202312011234abcdef12345
    /// </summary>
    /// <param name="endToEndId">EndToEndId a ser validado.</param>
    /// <returns>True se o EndToEndId for válido.</returns>
    public static bool IsValidEndToEndId(string? endToEndId)
    {
        if (string.IsNullOrEmpty(endToEndId) || endToEndId.Length != 32)
            return false;

        if (endToEndId[0] != 'E')
            return false;

        return true;
    }
}
