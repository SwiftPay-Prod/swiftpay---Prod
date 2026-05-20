using System.Text.Json;
using System.Text.Json.Serialization;
using safefy_api_payment.Clients.Coldfy.Models.Withdrawals;

namespace safefy_api_payment.Clients.Coldfy.Utils;

public sealed class ColdfyPixKeyTypeConverter : JsonConverter<ColdfyPixKeyType>
{
    public override ColdfyPixKeyType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrWhiteSpace(value))
            return ColdfyPixKeyType.Unknown;

        return value.Trim().ToLowerInvariant() switch
        {
            "cpf" => ColdfyPixKeyType.Cpf,
            "cnpj" => ColdfyPixKeyType.Cnpj,
            "email" => ColdfyPixKeyType.Email,
            "phone" => ColdfyPixKeyType.Phone,
            "telefone" => ColdfyPixKeyType.Phone,
            "evp" => ColdfyPixKeyType.Evp,
            _ => ColdfyPixKeyType.Unknown
        };
    }

    public override void Write(Utf8JsonWriter writer, ColdfyPixKeyType value, JsonSerializerOptions options)
    {
        var stringValue = value switch
        {
            ColdfyPixKeyType.Cnpj => "cnpj",
            ColdfyPixKeyType.Email => "email",
            ColdfyPixKeyType.Phone => "phone",
            ColdfyPixKeyType.Evp => "evp",
            _ => "cpf"
        };

        writer.WriteStringValue(stringValue);
    }
}

public sealed class ColdfyWithdrawalStatusConverter : JsonConverter<ColdfyWithdrawalStatus>
{
    public override ColdfyWithdrawalStatus Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrWhiteSpace(value))
            return ColdfyWithdrawalStatus.Unknown;

        return value.Trim().ToLowerInvariant() switch
        {
            "pending" => ColdfyWithdrawalStatus.Pending,
            "approved" => ColdfyWithdrawalStatus.Approved,
            "paid" => ColdfyWithdrawalStatus.Paid,
            "failed" => ColdfyWithdrawalStatus.Failed,
            "canceled" => ColdfyWithdrawalStatus.Canceled,
            "cancelled" => ColdfyWithdrawalStatus.Canceled,
            _ => ColdfyWithdrawalStatus.Unknown
        };
    }

    public override void Write(Utf8JsonWriter writer, ColdfyWithdrawalStatus value, JsonSerializerOptions options)
    {
        var stringValue = value switch
        {
            ColdfyWithdrawalStatus.Pending => "pending",
            ColdfyWithdrawalStatus.Approved => "approved",
            ColdfyWithdrawalStatus.Paid => "paid",
            ColdfyWithdrawalStatus.Failed => "failed",
            ColdfyWithdrawalStatus.Canceled => "canceled",
            _ => "pending"
        };

        writer.WriteStringValue(stringValue);
    }
}
