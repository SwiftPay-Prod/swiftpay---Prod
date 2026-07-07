using System.Text.Json;
using swiftpay_api_payment.Clients.Common;
using swiftpay_api_payment.Clients.HeartPay.Models.Boletos;
using swiftpay_api_payment.Clients.HeartPay.Models.Charges;
using swiftpay_api_payment.Clients.HeartPay.Models.Payouts;

namespace swiftpay_api_payment.Clients.HeartPay;

internal static class HeartPayResponseParser
{
    public static HeartPayChargeData ParseChargeData(JsonElement root)
    {
        var data = AcquirerJsonReader.ExtractPayload(root, "data", "charge", "transaction", "payment");
        var pix = AcquirerJsonReader.ExtractPayload(data, "pix");
        var correlationId = AcquirerJsonReader.ReadString(data, "correlationID", "correlationId", "correlation_id")
            ?? AcquirerJsonReader.ReadString(root, "correlationID", "correlationId", "correlation_id");
        var qrCodeImage = AcquirerJsonReader.ReadString(data, "brCode", "qrCode", "qrcode", "qr_code")
            ?? AcquirerJsonReader.ReadString(root, "qrCodeImage", "qrCode", "qrcode", "qr_code")
            ?? AcquirerJsonReader.ReadString(pix, "qrCodeImage", "qrCode", "qrcode", "qr_code");
        var brCode = AcquirerJsonReader.ReadString(data, "brCode", "brcode", "br_code", "copyAndPaste", "pixCode", "emv", "pixCopiaECola")
            ?? AcquirerJsonReader.ReadString(root, "brCode", "brcode", "br_code", "copyAndPaste", "pixCode", "emv", "pixCopiaECola")
            ?? AcquirerJsonReader.ReadString(pix, "brCode", "brcode", "br_code", "copyAndPaste", "pixCode", "emv", "pixCopiaECola");
        var id = correlationId
            ?? AcquirerJsonReader.ReadString(data, "id", "chargeId", "transactionId", "txId")
            ?? AcquirerJsonReader.ReadString(root, "id", "txId");

        return new HeartPayChargeData
        {
            Id = id,
            CorrelationId = correlationId ?? id,
            Status = AcquirerJsonReader.ReadString(data, "status", "state", "situation") ?? AcquirerJsonReader.ReadString(root, "status", "state"),
            TxId = AcquirerJsonReader.ReadString(data, "txId", "txid", "transactionId", "id") ?? id,
            BrCode = brCode,
            QrCode = qrCodeImage,
            CopyAndPaste = brCode,
            PaymentLinkUrl = AcquirerJsonReader.ReadString(data, "paymentLinkUrl", "payment_link_url")
                ?? AcquirerJsonReader.ReadString(root, "paymentLinkUrl", "payment_link_url"),
            EndToEndId = AcquirerJsonReader.ReadString(pix, "endToEndId", "endToEnd", "e2eid")
                ?? AcquirerJsonReader.ReadString(data, "endToEndId", "endToEnd", "e2eid"),
            ExpiresAt = AcquirerJsonReader.ReadDateTime(data, "expiresAt", "expiresDate", "expirationDate")
                ?? AcquirerJsonReader.ReadDateTime(root, "expiresAt", "expiresDate", "expirationDate")
                ?? AcquirerJsonReader.ReadDateTime(pix, "expiresAt", "expiresDate", "expirationDate"),
            PaidAt = AcquirerJsonReader.ReadDateTime(data, "paidAt", "completedAt", "doneAt"),
            ErrorMessage = AcquirerJsonReader.ReadString(data, "errorMessage", "error", "message")
        };
    }

    public static HeartPayBoletoData ParseBoletoData(JsonElement root)
    {
        var data = AcquirerJsonReader.ExtractPayload(root, "data", "boleto", "billet", "payment");
        var boleto = AcquirerJsonReader.ExtractPayload(data, "boleto", "billet");
        var pix = AcquirerJsonReader.ExtractPayload(data, "pix");
        var recipient = AcquirerJsonReader.ExtractPayload(data, "beneficiary", "receiver", "recipient", "company", "merchant", "account");
        var recipientFromBoleto = AcquirerJsonReader.ExtractPayload(boleto, "beneficiary", "receiver", "recipient", "company", "merchant", "account");
        var correlationId = AcquirerJsonReader.ReadString(data, "correlationID", "correlationId", "correlation_id")
            ?? AcquirerJsonReader.ReadString(root, "correlationID", "correlationId", "correlation_id");
        var id = correlationId
            ?? AcquirerJsonReader.ReadString(data, "id", "boletoId", "billetId", "chargeId")
            ?? AcquirerJsonReader.ReadString(root, "id");

        return new HeartPayBoletoData
        {
            Id = id,
            CorrelationId = correlationId ?? id,
            Status = AcquirerJsonReader.ReadString(data, "status", "state", "situation") ?? AcquirerJsonReader.ReadString(root, "status", "state"),
            Barcode = AcquirerJsonReader.ReadString(boleto, "barcode") ?? AcquirerJsonReader.ReadString(data, "barcode"),
            DigitableLine = AcquirerJsonReader.ReadString(boleto, "digitable", "digitableLine", "linhaDigitavel")
                ?? AcquirerJsonReader.ReadString(data, "digitable", "digitableLine", "linhaDigitavel"),
            PdfUrl = AcquirerJsonReader.ReadString(boleto, "pdfUrl", "bankSlipUrl", "billetUrl", "boletoUrl", "downloadUrl", "url")
                ?? AcquirerJsonReader.ReadString(data, "pdfUrl", "bankSlipUrl", "billetUrl", "boletoUrl", "downloadUrl", "url"),
            RecipientName = AcquirerJsonReader.ReadString(recipient, "name", "fullName", "tradeName")
                ?? AcquirerJsonReader.ReadString(recipientFromBoleto, "name", "fullName", "tradeName")
                ?? AcquirerJsonReader.ReadString(boleto, "recipientName", "beneficiaryName", "receiverName", "beneficiary", "receiver", "recipient", "cedente", "beneficiario")
                ?? AcquirerJsonReader.ReadString(data, "recipientName", "beneficiaryName", "receiverName")
                ?? AcquirerJsonReader.ReadString(root, "recipientName", "beneficiaryName", "receiverName"),
            RecipientDocument = AcquirerJsonReader.ReadDocument(recipient, "taxID", "taxId", "document", "documentNumber", "cpfCnpj", "cpf", "cnpj")
                ?? AcquirerJsonReader.ReadDocument(recipientFromBoleto, "taxID", "taxId", "document", "documentNumber", "cpfCnpj", "cpf", "cnpj")
                ?? AcquirerJsonReader.ReadDocument(boleto, "recipientDocument", "beneficiaryDocument", "receiverDocument", "taxID", "taxId", "document", "documentNumber", "cpfCnpj", "cpf", "cnpj")
                ?? AcquirerJsonReader.ReadDocument(data, "recipientDocument", "beneficiaryDocument", "receiverDocument")
                ?? AcquirerJsonReader.ReadDocument(root, "recipientDocument", "beneficiaryDocument", "receiverDocument"),
            BrCode = AcquirerJsonReader.ReadString(pix, "brCode", "brcode", "br_code", "payload", "copyAndPaste", "pixCode", "pixCopiaECola")
                ?? AcquirerJsonReader.ReadString(data, "brCode", "brcode", "br_code", "payload", "copyAndPaste", "pixCode", "pixCopiaECola"),
            PixExpiresAt = AcquirerJsonReader.ReadDateTime(pix, "expiresAt", "expiresDate", "expirationDate")
                ?? AcquirerJsonReader.ReadDateTime(data, "pixExpiresAt", "pixExpirationDate"),
            DueDate = AcquirerJsonReader.ReadDateTime(data, "expiresAt", "expiresDate", "dueDate", "expirationDate")
                ?? AcquirerJsonReader.ReadDateTime(boleto, "expiresAt", "expiresDate", "dueDate", "expirationDate"),
            PaidAt = AcquirerJsonReader.ReadDateTime(data, "paidAt", "completedAt", "doneAt"),
            ErrorMessage = AcquirerJsonReader.ReadString(data, "errorMessage", "error", "message")
        };
    }

    public static HeartPayPayoutData ParsePayoutData(JsonElement root)
    {
        var data = AcquirerJsonReader.ExtractPayload(root, "data", "payout", "withdrawal");
        var pix = AcquirerJsonReader.ExtractPayload(data, "pix");
        var referenceCode = AcquirerJsonReader.ReadString(data, "reference_code", "referenceCode");
        var correlationId = AcquirerJsonReader.ReadString(data, "correlationID", "correlationId", "correlation_id")
            ?? AcquirerJsonReader.ReadString(root, "correlationID", "correlationId", "correlation_id")
            ?? referenceCode;
        var payoutId = AcquirerJsonReader.ReadString(data, "id", "payoutId", "withdrawalId")
            ?? AcquirerJsonReader.ReadString(root, "id")
            ?? referenceCode;

        return new HeartPayPayoutData
        {
            Id = payoutId,
            CorrelationId = correlationId,
            ReferenceCode = referenceCode,
            Status = AcquirerJsonReader.ReadString(data, "status", "state", "situation") ?? AcquirerJsonReader.ReadString(root, "status", "state"),
            EndToEndId = AcquirerJsonReader.ReadString(data, "endToEndId", "endToEnd", "e2eid")
                ?? AcquirerJsonReader.ReadString(pix, "endToEndId", "endToEnd", "e2eid"),
            PixKey = AcquirerJsonReader.ReadString(data, "pixKey", "pix_key", "key") ?? AcquirerJsonReader.ReadString(pix, "key", "keyValue"),
            PixKeyType = AcquirerJsonReader.ReadString(data, "pixKeyType", "pix_key_type", "keyType") ?? AcquirerJsonReader.ReadString(pix, "keyType"),
            PaidAt = AcquirerJsonReader.ReadDateTime(data, "paidAt", "completedAt", "completed_at", "doneAt"),
            ErrorMessage = AcquirerJsonReader.ReadString(data, "errorMessage", "error_message", "error", "message", "reason")
        };
    }

    public static string ExtractErrorMessage(string? responseBody)
    {
        if (string.IsNullOrWhiteSpace(responseBody))
            return "Erro ao processar requisicao.";

        if (!AcquirerJsonReader.TryParseJson(responseBody, out var document))
            return "Erro ao processar requisicao.";

        using (document)
        {
            var root = document.RootElement;
            var data = AcquirerJsonReader.ExtractPayload(root, "data", "error");

            var detailsMessage = ReadDetailsErrorMessage(data) ?? ReadDetailsErrorMessage(root);
            if (!string.IsNullOrWhiteSpace(detailsMessage))
                return detailsMessage;

            return AcquirerJsonReader.ReadString(data, "message", "error", "reason", "details")
                ?? AcquirerJsonReader.ReadString(root, "message", "error")
                ?? "Erro ao processar requisicao.";
        }
    }

    public static string? ExtractErrorCode(string? responseBody)
    {
        if (string.IsNullOrWhiteSpace(responseBody))
            return null;

        if (!AcquirerJsonReader.TryParseJson(responseBody, out var document))
            return null;

        using (document)
        {
            var root = document.RootElement;
            var data = AcquirerJsonReader.ExtractPayload(root, "data", "error");
            return AcquirerJsonReader.ReadString(data, "code", "errorCode") ?? AcquirerJsonReader.ReadString(root, "code", "errorCode");
        }
    }

    private static string? ReadDetailsErrorMessage(JsonElement source)
    {
        if (source.ValueKind != JsonValueKind.Object)
            return null;

        if (!AcquirerJsonReader.TryGetPropertyInsensitive(source, "details", out var details)
            && !AcquirerJsonReader.TryGetPropertyInsensitive(source, "detail", out details)
            && !AcquirerJsonReader.TryGetPropertyInsensitive(source, "errors", out details)
            && !AcquirerJsonReader.TryGetPropertyInsensitive(source, "validationErrors", out details))
        {
            return null;
        }

        if (details.ValueKind == JsonValueKind.String)
        {
            var value = details.GetString();
            return string.IsNullOrWhiteSpace(value) ? null : value;
        }

        if (details.ValueKind == JsonValueKind.Object)
        {
            var nested = AcquirerJsonReader.ReadString(details, "error", "message", "reason", "detail", "description");
            if (!string.IsNullOrWhiteSpace(nested))
                return nested;

            foreach (var property in details.EnumerateObject())
            {
                if (property.Value.ValueKind == JsonValueKind.String)
                {
                    var candidate = property.Value.GetString();
                    if (!string.IsNullOrWhiteSpace(candidate))
                        return candidate;
                }

                if (property.Value.ValueKind == JsonValueKind.Object)
                {
                    var deepNested = AcquirerJsonReader.ReadString(property.Value, "error", "message", "reason", "detail", "description");
                    if (!string.IsNullOrWhiteSpace(deepNested))
                        return deepNested;
                }
            }
        }

        if (details.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in details.EnumerateArray())
            {
                if (item.ValueKind == JsonValueKind.String)
                {
                    var candidate = item.GetString();
                    if (!string.IsNullOrWhiteSpace(candidate))
                        return candidate;
                    continue;
                }

                if (item.ValueKind == JsonValueKind.Object)
                {
                    var nested = AcquirerJsonReader.ReadString(item, "error", "message", "reason", "detail", "description");
                    if (!string.IsNullOrWhiteSpace(nested))
                        return nested;
                }
            }
        }

        return null;
    }
}