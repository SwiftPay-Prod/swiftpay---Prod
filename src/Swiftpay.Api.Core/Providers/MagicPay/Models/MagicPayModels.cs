using System.Text.Json.Serialization;

namespace Swiftpay.Api.Core.Providers.MagicPay.Models;

public record MagicPayPaymentRequest(
    [property: JsonPropertyName("amount")] long Amount,
    [property: JsonPropertyName("currency")] string Currency,
    [property: JsonPropertyName("method")] string Method,
    [property: JsonPropertyName("description")] string Description,
    [property: JsonPropertyName("externalRef")] string ExternalRef,
    [property: JsonPropertyName("notificationUrl")] string NotificationUrl,
    [property: JsonPropertyName("payer")] MagicPayPayer Payer,
    [property: JsonPropertyName("split")] IReadOnlyList<MagicPaySplit>? Split = null);

public record MagicPayPayer(
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("taxId")] string TaxId,
    [property: JsonPropertyName("email")] string Email,
    [property: JsonPropertyName("phone")] string Phone);

public record MagicPayPaymentResponse(
    [property: JsonPropertyName("id")] string? Id,
    [property: JsonPropertyName("amount")] long? Amount,
    [property: JsonPropertyName("status")] string? Status,
    [property: JsonPropertyName("data")] MagicPayData? Data,
    [property: JsonPropertyName("payer")] MagicPayPayer? Payer,
    [property: JsonPropertyName("error")] string? Error,
    [property: JsonPropertyName("message")] string? Message);

public record MagicPaySplit(
    [property: JsonPropertyName("amount")] long Amount,
    [property: JsonPropertyName("currency")] string Currency,
    [property: JsonPropertyName("percent")] int Percent,
    [property: JsonPropertyName("storeId")] string StoreId);

public record MagicPayData(
    [property: JsonPropertyName("copypaste")] string? Copypaste,
    [property: JsonPropertyName("e2e")] string? E2E,
    [property: JsonPropertyName("barcode")] string? Barcode,
    [property: JsonPropertyName("boleto_url")] string? BoletoUrl);
