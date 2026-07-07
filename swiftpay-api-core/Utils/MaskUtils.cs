namespace swiftpay_api_core.Utils;

public static class MaskUtils
{
    private const string Bullet = "•";
    private const string Bullets3 = "•••";
    private const string Bullets4 = "••••";

    public static string MaskDocument(string? document)
    {
        if (string.IsNullOrEmpty(document))
            return Bullets3;

        var cleanDoc = new string(document.Where(char.IsDigit).ToArray());

        // CPF: XXX.•••.•••-XX (mostra primeiros 3 e últimos 2)
        if (cleanDoc.Length == 11)
            return $"{cleanDoc[..3]}.{Bullets3}.{Bullets3}-{cleanDoc[^2..]}";

        // CNPJ: XX.•••.•••/••••-XX (mostra primeiros 2 e últimos 2)
        if (cleanDoc.Length == 14)
            return $"{cleanDoc[..2]}.{Bullets3}.{Bullets3}/{Bullets4}-{cleanDoc[^2..]}";

        if (cleanDoc.Length < 6)
            return Bullets3;

        return $"{cleanDoc[..3]}{Bullets3}{cleanDoc[^2..]}";
    }

    public static string MaskPixKey(string? pixKey, string? pixKeyType = null)
    {
        if (string.IsNullOrEmpty(pixKey))
            return Bullets3;

        if (!string.IsNullOrEmpty(pixKeyType))
        {
            return pixKeyType.ToUpperInvariant() switch
            {
                "CPF" => MaskDocument(pixKey),
                "CNPJ" => MaskDocument(pixKey),
                "EMAIL" => MaskEmail(pixKey),
                "PHONE" => MaskPhone(pixKey),
                "RANDOM" => MaskRandom(pixKey),
                _ => MaskGeneric(pixKey)
            };
        }

        return DetectAndMask(pixKey);
    }

    public static string MaskEmail(string? email)
    {
        if (string.IsNullOrEmpty(email))
            return Bullets3;

        var atIndex = email.IndexOf('@');
        if (atIndex <= 0)
            return MaskGeneric(email);

        var localPart = email[..atIndex];
        var domain = email[atIndex..];

        if (localPart.Length <= 2)
            return $"{Bullets3}{domain}";

        return $"{localPart[..2]}{Bullets3}{domain}";
    }

    public static string MaskPhone(string? phone)
    {
        if (string.IsNullOrEmpty(phone))
            return Bullets3;

        // +55 (11) 99999-9999 -> +55 ••• 9999
        if (phone.StartsWith('+') && phone.Length >= 10)
        {
            var countryCode = phone[..3];
            var rest = phone[3..];
            if (rest.Length >= 4)
                return $"{countryCode} {Bullets3} {rest[^4..]}";
            return $"{countryCode} {Bullets3}";
        }

        if (phone.Length < 6)
            return Bullets3;

        // Mostra DDD e últimos 4 dígitos: (11) ••• 9999
        return $"({phone[..2]}) {Bullets3} {phone[^4..]}";
    }

    public static string MaskRandom(string? random)
    {
        if (string.IsNullOrEmpty(random))
            return Bullets3;

        // UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
        // Mostra primeiros 8 e últimos 4: xxxxxxxx-••••-••••-••••-••••xxxx
        if (random.Length == 36 && random.Contains('-'))
        {
            return $"{random[..8]}-{Bullets4}-{Bullets4}-{Bullets4}-{Bullets4[..4]}{random[^4..]}";
        }

        var clean = random.Replace("-", "");

        if (clean.Length < 8)
            return Bullets3;

        return $"{clean[..4]}{Bullets3}{clean[^4..]}";
    }

    public static string MaskGeneric(string? value)
    {
        if (string.IsNullOrEmpty(value) || value.Length < 6)
            return Bullets3;

        return $"{value[..3]}{Bullets3}{value[^3..]}";
    }

    private static string DetectAndMask(string pixKey)
    {
        if (pixKey.Contains('@'))
            return MaskEmail(pixKey);

        if (pixKey.StartsWith('+'))
            return MaskPhone(pixKey);

        if (pixKey.Contains('-') && pixKey.Length == 36)
            return MaskRandom(pixKey);

        var digitsOnly = new string(pixKey.Where(char.IsDigit).ToArray());

        if (digitsOnly.Length == 11)
            return MaskDocument(digitsOnly);

        if (digitsOnly.Length == 14)
            return MaskDocument(digitsOnly);

        return MaskGeneric(pixKey);
    }
}
