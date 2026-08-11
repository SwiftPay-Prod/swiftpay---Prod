using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Endpoints.Acquirers.AkkadPag.Webhook;

public class AkkadPagTransactionWebhookRequest
{
    [JsonPropertyName("event")]
    public string? Event { get; set; }

    [JsonPropertyName("transaction")]
    public AkkadPagTransactionWebhookTransaction? Transaction { get; set; }

    [JsonPropertyName("sent_at")]
    public DateTime? SentAt { get; set; }
}

public class AkkadPagTransactionWebhookTransaction
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("amount")]
    public long Amount { get; set; }

    [JsonPropertyName("currency")]
    public string? Currency { get; set; }

    [JsonPropertyName("payment_method")]
    public string? PaymentMethod { get; set; }

    [JsonPropertyName("installments")]
    public int Installments { get; set; }

    [JsonPropertyName("customer")]
    public AkkadPagTransactionWebhookCustomer? Customer { get; set; }

    [JsonPropertyName("items")]
    public List<AkkadPagTransactionWebhookItem>? Items { get; set; }

    [JsonPropertyName("pix")]
    public AkkadPagTransactionWebhookPix? Pix { get; set; }

    [JsonPropertyName("payer")]
    public AkkadPagTransactionWebhookPayer? Payer { get; set; }

    [JsonPropertyName("paid_at")]
    public DateTime? PaidAt { get; set; }

    [JsonPropertyName("refund_at")]
    public DateTime? RefundAt { get; set; }

    [JsonPropertyName("created_at")]
    public DateTime? CreatedAt { get; set; }

    [JsonPropertyName("updated_at")]
    public DateTime? UpdatedAt { get; set; }
}

public class AkkadPagTransactionWebhookCustomer
{
    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("phone")]
    public string? Phone { get; set; }

    [JsonPropertyName("document")]
    public string? Document { get; set; }

    [JsonPropertyName("document_type")]
    public string? DocumentType { get; set; }
}

public class AkkadPagTransactionWebhookItem
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("quantity")]
    public int Quantity { get; set; }

    [JsonPropertyName("product")]
    public AkkadPagTransactionWebhookProduct? Product { get; set; }
}

public class AkkadPagTransactionWebhookProduct
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("title")]
    public string? Title { get; set; }

    [JsonPropertyName("unit_price")]
    public long UnitPrice { get; set; }

    [JsonPropertyName("quantity")]
    public int Quantity { get; set; }

    [JsonPropertyName("physical")]
    public bool? Physical { get; set; }

    [JsonPropertyName("external_ref")]
    public string? ExternalRef { get; set; }
}

public class AkkadPagTransactionWebhookPix
{
    [JsonPropertyName("copy_paste")]
    public string? CopyPaste { get; set; }

    [JsonPropertyName("end_to_end")]
    public string? EndToEnd { get; set; }

    [JsonPropertyName("expires_at")]
    public DateTime? ExpiresAt { get; set; }
}

public class AkkadPagTransactionWebhookPayer
{
    [JsonPropertyName("ispb")]
    public string? Ispb { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("issuer")]
    public string? Issuer { get; set; }

    [JsonPropertyName("number")]
    public string? Number { get; set; }

    [JsonPropertyName("document")]
    public string? Document { get; set; }

    [JsonPropertyName("account_type")]
    public string? AccountType { get; set; }
}

public class AkkadPagWithdrawalWebhookRequest
{
    [JsonPropertyName("event")]
    public string? Event { get; set; }

    [JsonPropertyName("withdrawal")]
    public AkkadPagWithdrawalWebhookWithdrawal? Withdrawal { get; set; }

    [JsonPropertyName("sent_at")]
    public DateTime? SentAt { get; set; }
}

public class AkkadPagWithdrawalWebhookWithdrawal
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("amount")]
    public long Amount { get; set; }

    [JsonPropertyName("net_amount")]
    public long NetAmount { get; set; }

    [JsonPropertyName("method")]
    public string? Method { get; set; }

    [JsonPropertyName("pix_key")]
    public string? PixKey { get; set; }

    [JsonPropertyName("pix_key_type")]
    public string? PixKeyType { get; set; }

    [JsonPropertyName("end_to_end")]
    public string? EndToEnd { get; set; }

    [JsonPropertyName("receiver")]
    public AkkadPagWithdrawalWebhookReceiver? Receiver { get; set; }

    [JsonPropertyName("paid_at")]
    public DateTime? PaidAt { get; set; }

    [JsonPropertyName("created_at")]
    public DateTime? CreatedAt { get; set; }

    [JsonPropertyName("updated_at")]
    public DateTime? UpdatedAt { get; set; }
}

public class AkkadPagWithdrawalWebhookReceiver
{
    [JsonPropertyName("ispb")]
    public string? Ispb { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("issuer")]
    public string? Issuer { get; set; }

    [JsonPropertyName("number")]
    public string? Number { get; set; }

    [JsonPropertyName("document")]
    public string? Document { get; set; }

    [JsonPropertyName("account_type")]
    public string? AccountType { get; set; }
}
