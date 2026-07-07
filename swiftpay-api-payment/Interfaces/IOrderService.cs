using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_payment.Models.Orders;

namespace swiftpay_api_payment.Interfaces;

public interface IOrderService
{
    /// <summary>
    /// Cria um Order a partir de um Checkout (e-commerce flow).
    /// Calcula totais, aplica cupom se informado, e cria o Payment automaticamente.
    /// </summary>
    Task<OrderResult> CreateFromCheckoutAsync(CreateOrderInput input, CancellationToken ct = default);

    /// <summary>
    /// Cria um Order diretamente (via painel ou API interna).
    /// Usado quando o merchant cria pedidos manualmente.
    /// </summary>
    Task<OrderResult> CreateAsync(CreateOrderInput input, CancellationToken ct = default);

    /// <summary>
    /// Atualiza o status de fulfillment de um Order.
    /// </summary>
    Task<OrderResult> UpdateFulfillmentStatusAsync(
        Guid orderId,
        Guid merchantId,
        ApiEnvironment environment,
        OrderFulfillmentStatus newStatus,
        CancellationToken ct = default);

    /// <summary>
    /// Cancela um Order (se Payment ainda não foi pago).
    /// </summary>
    Task<OrderResult> CancelAsync(Guid orderId, Guid merchantId, ApiEnvironment environment, CancellationToken ct = default);

    /// <summary>
    /// Obtém um Order por ID.
    /// </summary>
    Task<Order?> GetByIdAsync(Guid orderId, Guid merchantId, ApiEnvironment environment, CancellationToken ct = default);
}
