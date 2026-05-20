using System.Text.Json.Serialization;
using safefy_api_payment.Utils;

namespace safefy_api_payment.Clients.HunterPay.Models.Transactions;

public sealed class HunterPayCreateTransactionRequest
{
    [JsonPropertyName("customer")]
    public HunterPayTransactionCustomer? Customer { get; init; }

    [JsonPropertyName("paymentMethod")]
    public string PaymentMethod { get; init; } = "PIX";

    [JsonPropertyName("pix")]
    public HunterPayPixRequest? Pix { get; init; }

    [JsonPropertyName("items")]
    public IReadOnlyList<HunterPayTransactionItem> Items { get; init; } = [];

    [JsonPropertyName("amount")]
    public long Amount { get; init; }

    [JsonPropertyName("postbackUrl")]
    public string? PostbackUrl { get; init; }

    [JsonPropertyName("metadata")]
    public IReadOnlyDictionary<string, object?>? Metadata { get; init; }

    [JsonPropertyName("description")]
    public string? Description { get; init; }
}

public sealed class HunterPayPixRequest
{
    [JsonPropertyName("expiresInDays")]
    public int? ExpiresInDays { get; init; }
}

public sealed class HunterPayTransactionCustomer
{
    [JsonPropertyName("name")]
    public string? Name { get; init; }

    [JsonPropertyName("email")]
    public string? Email { get; init; }

    [JsonPropertyName("phone")]
    public string? Phone { get; init; }

    [JsonPropertyName("document")]
    public HunterPayTransactionDocument? Document { get; init; }
}

public sealed class HunterPayTransactionDocument
{
    [JsonPropertyName("number")]
    public string? Number { get; init; }

    [JsonPropertyName("type")]
    public string? Type { get; init; }
}

public sealed class HunterPayTransactionItem
{
    [JsonPropertyName("title")]
    public string Title { get; init; } = string.Empty;

    [JsonPropertyName("unitPrice")]
    public long UnitPrice { get; init; }

    [JsonPropertyName("quantity")]
    public int Quantity { get; init; } = 1;

    [JsonPropertyName("externalRef")]
    public string? ExternalRef { get; init; }
}

public sealed class HunterPayTransactionData
{
    [JsonPropertyName("id")]
    public string? Id { get; init; }

    [JsonPropertyName("status")]
    public HunterPayTransactionStatus? Status { get; init; }

    [JsonPropertyName("amount")]
    public long Amount { get; init; }

    [JsonPropertyName("paidAmount")]
    public long? PaidAmount { get; init; }

    [JsonPropertyName("refundedAmount")]
    public long? RefundedAmount { get; init; }

    [JsonPropertyName("paymentMethod")]
    public string? PaymentMethod { get; init; }

    [JsonPropertyName("description")]
    public string? Description { get; init; }

    [JsonPropertyName("postbackUrl")]
    public string? PostbackUrl { get; init; }

    [JsonPropertyName("metadata")]
    public IReadOnlyDictionary<string, object?>? Metadata { get; init; }

    [JsonPropertyName("createdAt")]
    public string? CreatedAtRaw { get; init; }

    [JsonIgnore]
    public DateTime? CreatedAt => WebhookDateTimeConverter.ParseNullableDateTime(CreatedAtRaw);

    [JsonPropertyName("updatedAt")]
    public string? UpdatedAtRaw { get; init; }

    [JsonIgnore]
    public DateTime? UpdatedAt => WebhookDateTimeConverter.ParseNullableDateTime(UpdatedAtRaw);

    [JsonPropertyName("paidAt")]
    public string? PaidAtRaw { get; init; }

    [JsonIgnore]
    public DateTime? PaidAt => WebhookDateTimeConverter.ParseNullableDateTime(PaidAtRaw);

    [JsonPropertyName("customer")]
    public HunterPayTransactionCustomerResponse? Customer { get; init; }

    [JsonPropertyName("pix")]
    public HunterPayTransactionPix? Pix { get; init; }
}

public sealed class HunterPayTransactionCustomerResponse
{
    [JsonPropertyName("id")]
    public string? Id { get; init; }

    [JsonPropertyName("name")]
    public string? Name { get; init; }

    [JsonPropertyName("email")]
    public string? Email { get; init; }

    [JsonPropertyName("phone")]
    public string? Phone { get; init; }

    [JsonPropertyName("document")]
    public HunterPayTransactionDocumentValue? Document { get; init; }

    public string? DocumentNumber
    {
        get
        {
            return Document?.Number;
        }
    }

    public string? ResolvedDocumentNumber => DocumentNumber;
}

public sealed class HunterPayTransactionPix
{
    [JsonPropertyName("qrcode")]
    public string? QrCode { get; init; }

    [JsonPropertyName("qrcodeText")]
    public string? QrCodeText { get; init; }

    [JsonPropertyName("copyAndPaste")]
    public string? CopyAndPaste { get; init; }

    [JsonPropertyName("emv")]
    public string? Emv { get; init; }

    [JsonPropertyName("textContent")]
    public string? TextContent { get; init; }

    [JsonPropertyName("expirationDate")]
    public string? ExpirationDateRaw { get; init; }

    [JsonIgnore]
    public DateTime? ExpirationDate => WebhookDateTimeConverter.ParseNullableDateTime(ExpirationDateRaw);

    [JsonPropertyName("end2EndId")]
    public string? EndToEndId { get; init; }

    [JsonPropertyName("endToEndId")]
    public string? AlternateEndToEndId { get; init; }

    [JsonPropertyName("receiptUrl")]
    public string? ReceiptUrl { get; init; }

    public string? ResolveCopyAndPaste()
    {
        if (!string.IsNullOrWhiteSpace(QrCodeText))
            return QrCodeText;

        if (!string.IsNullOrWhiteSpace(CopyAndPaste))
            return CopyAndPaste;

        if (!string.IsNullOrWhiteSpace(Emv))
            return Emv;

        if (!string.IsNullOrWhiteSpace(TextContent))
            return TextContent;

        return QrCode;
    }

    public string? ResolveEndToEndId()
    {
        if (!string.IsNullOrWhiteSpace(EndToEndId))
            return EndToEndId;

        return AlternateEndToEndId;
    }
}
