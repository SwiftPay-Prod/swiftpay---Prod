using System.Text.Json.Serialization;

namespace swiftpay_api_core.Models.Enum;

/// <summary>
/// Modo do Pix Link: define se o QR Code deve ser estático (reutilizável sem expiração) ou dinâmico.
/// Estático = QR não expira, pode ser impresso/colado.
/// Portátil = mesmo estático, mas sem dependência de checkout/pay_*
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum PixLinkMode
{
    /// <summary> Pix dinâmico (expiração normal)</summary>
    Dynamic,

    /// <summary> Pix estático com valor fixo (reutilizável sem expiração)</summary>
    StaticFixed,

    /// <summary> Pix estático sem valor (pagador escolhe, reutilizável sem expiração)</summary>
    StaticOpen,

    /// <summary> Pix estático portátil puro (EMV, pode ser colado)</summary>
    StaticPortable
}
