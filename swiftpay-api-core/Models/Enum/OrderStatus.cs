using System.Text.Json.Serialization;

namespace swiftpay_api_core.Models.Enum;

/// <summary>
/// Status do pedido
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum OrderStatus
{
    /// <summary>
    /// Pedido reservado (carrinho criado), estoque reservado, aguardando pagamento
    /// </summary>
    Reserved,

    /// <summary>
    /// Payment criado, aguardando confirmação de pagamento
    /// </summary>
    Pending,

    /// <summary>
    /// Pagamento confirmado, pedido pronto para processamento
    /// </summary>
    Confirmed,

    /// <summary>
    /// Pedido sendo processado/preparado
    /// </summary>
    Processing,

    /// <summary>
    /// Pedido finalizado/entregue
    /// </summary>
    Completed,

    /// <summary>
    /// Pedido cancelado
    /// </summary>
    Cancelled,

    /// <summary>
    /// Pedido reembolsado
    /// </summary>
    Refunded,

    /// <summary>
    /// Reserva expirou (timeout do carrinho)
    /// </summary>
    Expired
}
