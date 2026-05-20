namespace safefy_api_core.Constants;

public static class WayneProtocolConstants
{
    public const string ConfigKey = "wayne.protocol";
    public const string ProtocolCode = "Wayne";

    public static string CreateInternalProtocolCode(long merchantDisplayFee, long merchantDisplayNetAmount)
        => $"{ProtocolCode}|{merchantDisplayFee}|{merchantDisplayNetAmount}";

    public static bool TryGetMerchantDisplayValues(
        string? internalProtocolCode,
        out long merchantDisplayFee,
        out long merchantDisplayNetAmount)
    {
        merchantDisplayFee = 0;
        merchantDisplayNetAmount = 0;

        if (string.IsNullOrWhiteSpace(internalProtocolCode))
        {
            return false;
        }

        var parts = internalProtocolCode.Split('|', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length != 3)
        {
            return false;
        }

        if (!string.Equals(parts[0], ProtocolCode, StringComparison.Ordinal))
        {
            return false;
        }

        if (!long.TryParse(parts[1], out var fee) || fee < 0)
        {
            return false;
        }

        if (!long.TryParse(parts[2], out var netAmount) || netAmount < 0)
        {
            return false;
        }

        merchantDisplayFee = fee;
        merchantDisplayNetAmount = netAmount;
        return true;
    }
}
