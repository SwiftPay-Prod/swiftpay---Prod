using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Clients.AkkadPag.Models;

public record AkkadPagPaymentRequest
{
    [JsonPropertyName("amount")]
    public required long Amount { get; init; }

    [JsonPropertyName("payment_method")]
    public string PaymentMethod { get; init; } = "PIX";

    [JsonPropertyName("items")]
    public required List<AkkadPagItem> Items { get; init; }

    [JsonPropertyName("customer")]
    public required AkkadPagCustomer Customer { get; init; }

    [JsonPropertyName("postback_url")]
    public string? PostbackUrl { get; init; }

    [JsonPropertyName("utm")]
    public string? Utm { get; init; }
}

public record AkkadPagItem
{
    [JsonPropertyName("title")]
    public required string Title { get; init; }

    [JsonPropertyName("unit_price")]
    public required long UnitPrice { get; init; }

    [JsonPropertyName("quantity")]
    public required int Quantity { get; init; }

    [JsonPropertyName("tangible")]
    public bool Tangible { get; init; }

    [JsonPropertyName("external_ref")]
    public string? ExternalRef { get; init; }
}

public record AkkadPagCustomer
{
    [JsonPropertyName("name")]
    public required string Name { get; init; }

    [JsonPropertyName("email")]
    public required string Email { get; init; }

    [JsonPropertyName("phone")]
    public required string Phone { get; init; }

    [JsonPropertyName("document")]
    public required AkkadPagDocument Document { get; init; }
}

public record AkkadPagDocument
{
    [JsonPropertyName("number")]
    public required string Number { get; init; }

    [JsonPropertyName("type")]
    public required string Type { get; init; }
}

public record AkkadPagPaymentResponse
{
    [JsonPropertyName("id")]
    public string? Id { get; init; }

    [JsonPropertyName("amount")]
    public long Amount { get; init; }

    [JsonPropertyName("currency")]
    public string? Currency { get; init; }

    [JsonPropertyName("payment_method")]
    public string? PaymentMethod { get; init; }

    [JsonPropertyName("status")]
    public string? Status { get; init; }

    [JsonPropertyName("installments")]
    public int Installments { get; init; }

    [JsonPropertyName("customer")]
    public AkkadPagCustomer? Customer { get; init; }

    [JsonPropertyName("items")]
    public List<AkkadPagItem>? Items { get; init; }

    [JsonPropertyName("pix")]
    public AkkadPagPix? Pix { get; init; }

    [JsonPropertyName("paid_at")]
    public DateTime? PaidAt { get; init; }

    [JsonPropertyName("created_at")]
    public DateTime? CreatedAt { get; init; }

    [JsonPropertyName("updated_at")]
    public DateTime? UpdatedAt { get; init; }
}

public record AkkadPagPix
{
    [JsonPropertyName("copy_paste")]
    public string? CopyPaste { get; init; }

    [JsonPropertyName("end_to_end")]
    public string? EndToEnd { get; init; }

    [JsonPropertyName("expires_at")]
    public DateTime? ExpiresAt { get; init; }
}

public record AkkadPagWithdrawalRequest
{
    [JsonPropertyName("amount")]
    public required long Amount { get; init; }

    [JsonPropertyName("pix_key")]
    public required string PixKey { get; init; }

    [JsonPropertyName("pix_key_type")]
    public required string PixKeyType { get; init; }

    [JsonPropertyName("document")]
    public string? Document { get; init; }

    [JsonPropertyName("postback_url")]
    public string? PostbackUrl { get; init; }
}

public record AkkadPagWithdrawalResponse
{
    [JsonPropertyName("id")]
    public string? Id { get; init; }

    [JsonPropertyName("status")]
    public string? Status { get; init; }

    [JsonPropertyName("amount")]
    public long Amount { get; init; }

    [JsonPropertyName("net_amount")]
    public long NetAmount { get; init; }

    [JsonPropertyName("fee")]
    public long Fee { get; init; }

    [JsonPropertyName("method")]
    public string? Method { get; init; }

    [JsonPropertyName("pix_key")]
    public string? PixKey { get; init; }

    [JsonPropertyName("pix_key_type")]
    public string? PixKeyType { get; init; }

    [JsonPropertyName("auto_withdraw")]
    public bool AutoWithdraw { get; init; }

    [JsonPropertyName("created_at")]
    public DateTime? CreatedAt { get; init; }

    [JsonPropertyName("updated_at")]
    public DateTime? UpdatedAt { get; init; }
}

public record AkkadPagTransactionWebhook
{
    [JsonPropertyName("event")]
    public string? Event { get; init; }

    [JsonPropertyName("transaction")]
    public AkkadPagPaymentResponse? Transaction { get; init; }

    [JsonPropertyName("sent_at")]
    public DateTime? SentAt { get; init; }
}

public record AkkadPagWithdrawalWebhook
{
    [JsonPropertyName("event")]
    public string? Event { get; init; }

    [JsonPropertyName("withdrawal")]
    public AkkadPagWithdrawalResponse? Withdrawal { get; init; }

    [JsonPropertyName("sent_at")]
    public DateTime? SentAt { get; init; }
}

public record AkkadPagCompanyDetailsResponse
{
    [JsonPropertyName("statusCode")]
    public int StatusCode { get; init; }

    [JsonPropertyName("message")]
    public string? Message { get; init; }

    [JsonPropertyName("data")]
    public AkkadPagCompanyDetailsData? Data { get; init; }
}

public record AkkadPagCompanyDetailsData
{
    [JsonPropertyName("company_info")]
    public AkkadPagCompanyInfo? CompanyInfo { get; init; }

    [JsonPropertyName("fees")]
    public AkkadPagFees? Fees { get; init; }

    [JsonPropertyName("limits")]
    public AkkadPagLimits? Limits { get; init; }
}

public record AkkadPagCompanyInfo
{
    [JsonPropertyName("status")]
    public string? Status { get; init; }
}

public record AkkadPagFees
{
    [JsonPropertyName("pix")]
    public AkkadPagMethodFees? Pix { get; init; }

    [JsonPropertyName("boleto")]
    public AkkadPagMethodFees? Boleto { get; init; }

    [JsonPropertyName("card")]
    public AkkadPagMethodFees? Card { get; init; }
}

public record AkkadPagMethodFees
{
    [JsonPropertyName("enabled")]
    public bool Enabled { get; init; }

    [JsonPropertyName("percent")]
    public decimal Percent { get; init; }

    [JsonPropertyName("fixed")]
    public long Fixed { get; init; }
}

public record AkkadPagLimits
{
    [JsonPropertyName("min_transaction_amount")]
    public long? MinTransactionAmount { get; init; }

    [JsonPropertyName("max_transaction_amount")]
    public long? MaxTransactionAmount { get; init; }

    [JsonPropertyName("min_withdrawal_amount")]
    public long? MinWithdrawalAmount { get; init; }

    [JsonPropertyName("max_withdrawal_amount")]
    public long? MaxWithdrawalAmount { get; init; }
}

public record AkkadPagBalanceResponse
{
    [JsonPropertyName("statusCode")]
    public int StatusCode { get; init; }

    [JsonPropertyName("message")]
    public string? Message { get; init; }

    [JsonPropertyName("data")]
    public AkkadPagBalanceData? Data { get; init; }
}

public record AkkadPagBalanceData
{
    [JsonPropertyName("available")]
    public long Available { get; init; }

    [JsonPropertyName("reserved")]
    public long Reserved { get; init; }
}
