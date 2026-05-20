using System.Text.Json.Serialization;

namespace safefy_api_payment.Clients.Accithus.Models.Submerchant;

public sealed class AccithusCreateSubmerchantRequest
{
    [JsonPropertyName("legal_name")]
    public string LegalName { get; set; } = string.Empty;

    [JsonPropertyName("trade_name")]
    public string TradeName { get; set; } = string.Empty;

    [JsonPropertyName("entity_type")]
    public string EntityType { get; set; } = "pj";

    [JsonPropertyName("tax_id")]
    public string TaxId { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("phone")]
    public string? Phone { get; set; }

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("website")]
    public string? Website { get; set; }

    [JsonPropertyName("address")]
    public AccithusSubmerchantAddress? Address { get; set; }

    [JsonPropertyName("bank_account")]
    public AccithusSubmerchantBankAccount? BankAccount { get; set; }
}

public sealed class AccithusSubmerchantAddress
{
    [JsonPropertyName("street")]
    public string? Street { get; set; }

    [JsonPropertyName("number")]
    public string? Number { get; set; }

    [JsonPropertyName("complement")]
    public string? Complement { get; set; }

    [JsonPropertyName("neighborhood")]
    public string? Neighborhood { get; set; }

    [JsonPropertyName("city")]
    public string? City { get; set; }

    [JsonPropertyName("state")]
    public string? State { get; set; }

    [JsonPropertyName("zip_code")]
    public string? ZipCode { get; set; }
}

public sealed class AccithusSubmerchantBankAccount
{
    [JsonPropertyName("bank_code")]
    public string? BankCode { get; set; }

    [JsonPropertyName("branch")]
    public string? Branch { get; set; }

    [JsonPropertyName("account_number")]
    public string? AccountNumber { get; set; }

    [JsonPropertyName("account_type")]
    public string? AccountType { get; set; }
}
