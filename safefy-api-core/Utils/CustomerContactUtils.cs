using System.Text.RegularExpressions;
using System.Linq;

namespace safefy_api_core.Utils;

public static partial class CustomerContactUtils
{
    private const string DefaultFallbackPhoneDigits = "11999999999";

    public static bool HasFallbackContact(string? email, string? phone)
    {
        return IsFallbackEmail(email) || IsFallbackPhone(phone);
    }

    public static bool IsFallbackEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return false;

        return FallbackEmailRegex().IsMatch(email.Trim());
    }

    public static bool IsFallbackPhone(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
            return false;

        var digits = new string(phone.Where(char.IsDigit).ToArray());
        if (digits.Length > DefaultFallbackPhoneDigits.Length)
            digits = digits[^DefaultFallbackPhoneDigits.Length..];

        return string.Equals(digits, DefaultFallbackPhoneDigits, StringComparison.Ordinal);
    }

    [GeneratedRegex("^cliente\\+.+@safefy\\.com\\.br$", RegexOptions.IgnoreCase | RegexOptions.Compiled)]
    private static partial Regex FallbackEmailRegex();
}
