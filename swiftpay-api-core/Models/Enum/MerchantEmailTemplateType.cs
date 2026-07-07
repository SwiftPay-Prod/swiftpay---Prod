using System.Text.Json.Serialization;

namespace swiftpay_api_core.Models.Enum;

/// <summary>
/// Tipos de templates de email configuráveis pelo merchant
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum MerchantEmailTemplateType
{
    /// <summary>
    /// Email de confirmação de pagamento (todos os tipos de produto)
    /// </summary>
    PaymentConfirmation,

    /// <summary>
    /// Email de entrega de produtos digitais (chaves, links, etc)
    /// </summary>
    DigitalDelivery,

    /// <summary>
    /// Email de pedido enviado (produtos físicos)
    /// </summary>
    OrderShipped,

    /// <summary>
    /// Email de pedido entregue (produtos físicos)
    /// </summary>
    OrderDelivered,

    /// <summary>
    /// Email de boas-vindas para novos clientes
    /// </summary>
    Welcome,

    /// <summary>
    /// Email de carrinho abandonado para recuperação de vendas
    /// </summary>
    AbandonedCart
}

/// <summary>
/// Layout de exibição de itens no email de entrega digital
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum EmailTemplateLayout
{
    /// <summary>
    /// Exibe itens em formato de lista vertical
    /// </summary>
    List,

    /// <summary>
    /// Exibe itens em formato de cards horizontais
    /// </summary>
    Cards
}
