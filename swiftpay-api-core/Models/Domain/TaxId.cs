using swiftpay_api_core.Utils;

namespace swiftpay_api_core.Models.Domain;

public enum TaxIdType
{
    None = 0,
    Cpf = 1,
    Cnpj = 2
}

/// <summary>
/// Immutable Value Object representing a Brazilian Tax ID (CPF or CNPJ).
/// Encapsulates sanitization, Modulo 11 check-digit verification, and standard formatting.
/// </summary>
public readonly record struct TaxId : IEquatable<TaxId>
{
    public static readonly TaxId Empty = new(string.Empty, TaxIdType.None, false);

    private readonly string _digits;
    private readonly TaxIdType _type;
    private readonly bool _isValid;

    private TaxId(string digits, TaxIdType type, bool isValid)
    {
        _digits = digits;
        _type = type;
        _isValid = isValid;
    }

    public string Digits => _digits ?? string.Empty;
    public TaxIdType Type => _type;
    public bool IsValid => _isValid;

    public string Formatted => _type switch
    {
        TaxIdType.Cpf when Digits.Length == 11 =>
            $"{Digits[..3]}.{Digits[3..6]}.{Digits[6..9]}-{Digits[9..]}",
        TaxIdType.Cnpj when Digits.Length == 14 =>
            $"{Digits[..2]}.{Digits[2..5]}.{Digits[5..8]}/{Digits[8..12]}-{Digits[12..]}",
        _ => Digits
    };

    public bool Equals(TaxId other) =>
        Digits == other.Digits && _type == other._type && _isValid == other._isValid;

    public override int GetHashCode() =>
        HashCode.Combine(Digits, _type, _isValid);

    /// <summary>
    /// Attempts to parse and validate a raw CPF or CNPJ string.
    /// Returns true if the document has valid length and check digits.
    /// </summary>
    public static bool TryParse(string? raw, out TaxId taxId)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            taxId = Empty;
            return false;
        }

        var digits = new string(raw.Where(char.IsDigit).ToArray());

        if (digits.Length == 11)
        {
            if (DocumentUtils.IsValidCpf(digits))
            {
                taxId = new TaxId(digits, TaxIdType.Cpf, true);
                return true;
            }
        }
        else if (digits.Length == 14)
        {
            if (DocumentUtils.IsValidCnpj(digits))
            {
                taxId = new TaxId(digits, TaxIdType.Cnpj, true);
                return true;
            }
        }

        taxId = Empty;
        return false;
    }

    /// <summary>
    /// Creates a validated TaxId instance or throws an ArgumentException.
    /// </summary>
    public static TaxId Create(string raw)
    {
        if (!TryParse(raw, out var taxId))
        {
            throw new ArgumentException($"Documento (CPF/CNPJ) inválido: '{raw}'", nameof(raw));
        }

        return taxId;
    }

    public override string ToString() => Formatted;

    public static implicit operator string(TaxId taxId) => taxId.Digits;
}
