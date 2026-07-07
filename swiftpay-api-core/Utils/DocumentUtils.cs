namespace swiftpay_api_core.Utils;

public static class DocumentUtils
{
    private static readonly Random Random = new();

    public static string GenerateValidCpf()
    {
        var digits = new int[11];

        for (var i = 0; i < 9; i++)
            digits[i] = Random.Next(0, 10);

        var sum = 0;
        for (var i = 0; i < 9; i++)
            sum += digits[i] * (10 - i);

        var remainder = sum % 11;
        digits[9] = remainder < 2 ? 0 : 11 - remainder;

        sum = 0;
        for (var i = 0; i < 10; i++)
            sum += digits[i] * (11 - i);

        remainder = sum % 11;
        digits[10] = remainder < 2 ? 0 : 11 - remainder;

        return string.Concat(digits);
    }

    public static bool IsValidCpf(string cpf)
    {
        if (string.IsNullOrEmpty(cpf))
            return false;

        var digits = new string(cpf.Where(char.IsDigit).ToArray());

        if (digits.Length != 11)
            return false;

        if (digits.All(c => c == digits[0]))
            return false;

        var sum = 0;
        for (var i = 0; i < 9; i++)
            sum += (digits[i] - '0') * (10 - i);

        var remainder = sum % 11;
        var firstDigit = remainder < 2 ? 0 : 11 - remainder;

        if (digits[9] - '0' != firstDigit)
            return false;

        sum = 0;
        for (var i = 0; i < 10; i++)
            sum += (digits[i] - '0') * (11 - i);

        remainder = sum % 11;
        var secondDigit = remainder < 2 ? 0 : 11 - remainder;

        return digits[10] - '0' == secondDigit;
    }

    public static bool IsValidCnpj(string cnpj)
    {
        if (string.IsNullOrEmpty(cnpj))
            return false;

        var digits = new string(cnpj.Where(char.IsDigit).ToArray());

        if (digits.Length != 14)
            return false;

        if (digits.All(c => c == digits[0]))
            return false;

        int[] firstMultipliers = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        int[] secondMultipliers = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

        var sum = 0;
        for (var i = 0; i < 12; i++)
            sum += (digits[i] - '0') * firstMultipliers[i];

        var remainder = sum % 11;
        var firstDigit = remainder < 2 ? 0 : 11 - remainder;

        if (digits[12] - '0' != firstDigit)
            return false;

        sum = 0;
        for (var i = 0; i < 13; i++)
            sum += (digits[i] - '0') * secondMultipliers[i];

        remainder = sum % 11;
        var secondDigit = remainder < 2 ? 0 : 11 - remainder;

        return digits[13] - '0' == secondDigit;
    }
}
