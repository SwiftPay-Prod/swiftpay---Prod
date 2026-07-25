using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Clients.MagicPay.Models;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum MagicPayPaymentMethod
{
    PIX,
    BOLETO,
    CREDIT_CARD
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum MagicPayPaymentStatus
{
    PENDING,
    PROCESSING,
    PAID,
    REFUSED,
    REFUNDED,
    MED,
    CHARGEDBACK
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum MagicPayTransferStatus
{
    PENDING,
    PROCESSING,
    PAID,
    REFUSED
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum MagicPayPixKeyType
{
    CPF,
    CNPJ,
    EMAIL,
    PHONE,
    EVP
}
