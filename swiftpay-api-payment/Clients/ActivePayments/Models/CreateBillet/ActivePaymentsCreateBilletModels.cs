using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Clients.ActivePayments.Models.CreateBillet;

public sealed class ActivePaymentsCreateBilletRequest
{
    [JsonPropertyName("amount")]
    public required decimal Amount { get; init; }

    [JsonPropertyName("customerName")]
    public required string CustomerName { get; init; }

    [JsonPropertyName("customerCpf")]
    public required string CustomerCpf { get; init; }

    [JsonPropertyName("customerEmail")]
    public required string CustomerEmail { get; init; }

    [JsonPropertyName("dueDate")]
    public required string DueDate { get; init; }

    [JsonPropertyName("description")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Description { get; init; }

    [JsonPropertyName("street")]
    public required string Street { get; init; }

    [JsonPropertyName("number")]
    public required string Number { get; init; }

    [JsonPropertyName("complement")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Complement { get; init; }

    [JsonPropertyName("district")]
    public required string District { get; init; }

    [JsonPropertyName("city")]
    public required string City { get; init; }

    [JsonPropertyName("state")]
    public required string State { get; init; }

    [JsonPropertyName("zipCode")]
    public required string ZipCode { get; init; }

    [JsonPropertyName("externalReference")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? ExternalReference { get; init; }

    [JsonPropertyName("postbackUrl")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? PostbackUrl { get; init; }
}

public sealed class ActivePaymentsCreateBilletResponse
{
    [JsonPropertyName("chargeId")]
    public string? ChargeId { get; init; }

    [JsonPropertyName("externalId")]
    public string? ExternalId { get; init; }

    [JsonPropertyName("amount")]
    public string? Amount { get; init; }

    [JsonPropertyName("netAmount")]
    public string? NetAmount { get; init; }

    [JsonPropertyName("fee")]
    public string? Fee { get; init; }

    [JsonPropertyName("status")]
    public string? Status { get; init; }

    [JsonPropertyName("billet")]
    public ActivePaymentsBilletData? Billet { get; init; }
}

public sealed class ActivePaymentsBilletData
{
    [JsonPropertyName("barcode")]
    public string? Barcode { get; init; }

    [JsonPropertyName("digitableLine")]
    public string? DigitableLine { get; init; }

    [JsonPropertyName("billetUrl")]
    public string? BilletUrl { get; init; }

    [JsonPropertyName("dueDate")]
    public string? DueDateString { get; init; }
    
    /// <summary>
    /// Parses DueDateString to DateTime (always UTC), supporting multiple formats.
    /// Npgsql 6+ requires DateTimeKind.Utc for timestamp with time zone columns.
    /// </summary>
    [JsonIgnore]
    public DateTime? DueDate
    {
        get
        {
            if (string.IsNullOrWhiteSpace(DueDateString))
                return null;
            
            string[] formats =
            [
                "yyyy-MM-dd",
                "dd/MM/yyyy",
                "MM/dd/yyyy",
                "yyyy-MM-ddTHH:mm:ss",
                "yyyy-MM-ddTHH:mm:ssZ",
                "yyyy-MM-ddTHH:mm:ss.fZ",
                "yyyy-MM-ddTHH:mm:ss.ffZ",
                "yyyy-MM-ddTHH:mm:ss.fffZ",
                "yyyy-MM-ddTHH:mm:ss.ffffffZ",
                "yyyy-MM-ddTHH:mm:ss.fffffffZ"
            ];

            const System.Globalization.DateTimeStyles utcStyles =
                System.Globalization.DateTimeStyles.AssumeUniversal |
                System.Globalization.DateTimeStyles.AdjustToUniversal;
            
            if (DateTime.TryParseExact(DueDateString, formats, 
                System.Globalization.CultureInfo.InvariantCulture, 
                utcStyles, out var result))
            {
                return result;
            }
            
            if (DateTime.TryParse(DueDateString, 
                System.Globalization.CultureInfo.InvariantCulture,
                utcStyles, out result))
            {
                return result;
            }
            
            return null;
        }
    }
}
