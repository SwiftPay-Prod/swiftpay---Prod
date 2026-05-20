using System.Text.RegularExpressions;

namespace safefy_api_core.Utils;

public static partial class SanitizeUtils
{
    [GeneratedRegex(@"[^\d]")]
    private static partial Regex NonDigitRegex();

    public static string? SanitizeDocument(string? document)
    {
        if (string.IsNullOrWhiteSpace(document))
            return null;

        return NonDigitRegex().Replace(document, string.Empty);
    }

    public static string? SanitizePhone(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
            return null;

        return NonDigitRegex().Replace(phone, string.Empty);
    }

    public static string? SanitizeNumeric(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        return NonDigitRegex().Replace(value, string.Empty);
    }
}
