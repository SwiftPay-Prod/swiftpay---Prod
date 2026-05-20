using System.Text.Json.Serialization;

namespace safefy_api_core.Models.Enum;

/// <summary>
/// Status de fulfillment (preparação/entrega) do pedido
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum OrderFulfillmentStatus
{
    /// <summary>
    /// Pedido não iniciado (aguardando pagamento ou processamento)
    /// </summary>
    Unfulfilled,

    /// <summary>
    /// Pedido parcialmente preparado/enviado
    /// </summary>
    PartiallyFulfilled,

    /// <summary>
    /// Pedido totalmente preparado, pronto para envio
    /// </summary>
    Fulfilled,

    /// <summary>
    /// Pedido enviado/em trânsito
    /// </summary>
    Shipped,

    /// <summary>
    /// Pedido entregue ao cliente
    /// </summary>
    Delivered
}
