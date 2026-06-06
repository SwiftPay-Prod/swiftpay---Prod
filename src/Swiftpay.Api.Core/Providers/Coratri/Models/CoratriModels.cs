using System.Text.Json.Serialization;

namespace Swiftpay.Api.Core.Providers.Coratri.Models;

public record CoratriPixRequest(
    [property: JsonPropertyName("token")] string Token,
    [property: JsonPropertyName("secret")] string Secret,
    [property: JsonPropertyName("amount")] decimal Amount,
    [property: JsonPropertyName("debtor_name")] string DebtorName,
    [property: JsonPropertyName("email")] string Email,
    [property: JsonPropertyName("debtor_document_number")] string? DebtorDocument = null,
    [property: JsonPropertyName("phone")] string? Phone = null,
    [property: JsonPropertyName("postback")] string? Postback = null);

public record CoratriPixResponse(
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("message")] string? Message,
    [property: JsonPropertyName("transaction_id")] string? TransactionId,
    [property: JsonPropertyName("amount")] decimal? Amount,
    [property: JsonPropertyName("qr_code")] string? QrCode,
    [property: JsonPropertyName("qr_code_image_url")] string? QrCodeImageUrl);

public record CoratriStatusResponse(
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("webhook")] object? Webhook = null);

public record CoratriWebhookPayload(
    [property: JsonPropertyName("idTransaction")] string IdTransaction,
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("amount")] decimal Amount,
    [property: JsonPropertyName("paidAt")] string? PaidAt,
    [property: JsonPropertyName("typeTransaction")] string TypeTransaction,
    [property: JsonPropertyName("endToEndId")] string? EndToEndId,
    [property: JsonPropertyName("message")] string? Message);
