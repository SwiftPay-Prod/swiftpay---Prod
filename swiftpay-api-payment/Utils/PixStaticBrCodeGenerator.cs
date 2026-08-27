using swiftpay_api_payment.Endpoints.Transactions.Create;

using System.Security.Cryptography;
using System.Text;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_payment.Utils;

public static class PixStaticBrCodeGenerator
{
    public static PixTransactionData Generate(PaymentLink paymentLink, MerchantPayoutAccount payoutAccount)
    {
        var pixKey = payoutAccount.PixKey ?? string.Empty;
        var merchantName = (payoutAccount.HolderName ?? paymentLink.ProductName ?? "SwiftPay").Trim();
        var merchantCity = (payoutAccount.BankName ?? "SAO PAULO").Trim();
        var isFixed = paymentLink.PixLinkMode == PixLinkMode.StaticFixed;
        var isOpen = paymentLink.PixLinkMode == PixLinkMode.StaticOpen;
        var isPortable = paymentLink.PixLinkMode == PixLinkMode.StaticPortable;

        var sb = new StringBuilder();
        sb.Append("000201"); // payload format
        sb.Append("26580014br.gov.bcb.pix"); // gui
        sb.Append(FormatStringField("00", pixKey));
        sb.Append(FormatStringField("01", isFixed && paymentLink.Amount > 0 ? (paymentLink.Amount / 100m).ToString("0.00", null) : null));
        sb.Append(FormatStringField("02", merchantName));
        sb.Append(FormatStringField("03", merchantCity));
        var additional = isPortable ? string.Empty : FormatStringField("05", isFixed ? "StaticFixed" : "StaticOpen");
        sb.Append(additional);

        var payload = sb.ToString();
        var crc = ComputeCRC16(payload + "04");
        return new PixTransactionData
        {
            QrCode = payload + crc,
            CopyAndPaste = payload + crc,
            ExpiresAt = null,
            Status = PaymentStatus.Pending
        };
    }

    private static string FormatStringField(string id, string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        var text = value.Trim();
        if (text.Length > 99)
            text = text[..99];

        var len = text.Length.ToString("D2");
        return $"{id}{len}{text}";
    }

    private static string ComputeCRC16(string input)
    {
        var data = Encoding.ASCII.GetBytes(input + "6304");
        ushort crc = 0xFFFF;
        foreach (var b in data)
        {
            crc ^= (ushort)(b << 8);
            for (var i = 0; i < 8; i++)
            {
                crc = (ushort)((crc & 0x8000) != 0 ? (crc << 1) ^ 0x1021 : crc << 1);
            }
        }

        return "63" + crc.ToString("X4");
    }
}
