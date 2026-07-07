using System.Text.Json.Serialization;

namespace swiftpay_api_core.Models.Enum;

/// <summary>
/// Tipo de movimentação de estoque
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum StockMovementType
{
    /// <summary>
    /// Entrada de estoque (compra, ajuste positivo)
    /// </summary>
    In,

    /// <summary>
    /// Saída de estoque (venda confirmada)
    /// </summary>
    Out,

    /// <summary>
    /// Ajuste manual (correção de estoque)
    /// </summary>
    Adjustment,

    /// <summary>
    /// Reserva de estoque (carrinho criado)
    /// </summary>
    Reserved,

    /// <summary>
    /// Liberação de reserva (carrinho expirado/cancelado)
    /// </summary>
    Released,

    /// <summary>
    /// Confirmação de reserva (pagamento confirmado)
    /// </summary>
    Confirmed
}

/// <summary>
/// Tipo de referência para a movimentação de estoque
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum StockMovementReferenceType
{
    /// <summary>
    /// Referência a um pedido
    /// </summary>
    Order,

    /// <summary>
    /// Ajuste manual via painel
    /// </summary>
    Manual,

    /// <summary>
    /// Expiração de reserva
    /// </summary>
    Expiration
}
