using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using safefy_api_core.Models.Enum;

namespace safefy_api_core.Models.Database;

/// <summary>
/// Pedido do cliente - contém toda a lógica de negócio (produtos, cupons, frete, endereço)
/// O Payment vinculado cuida apenas da transação financeira
/// </summary>
public class Order
{
    [Key]
    public Guid Id { get; set; }

    /// <summary>
    /// Merchant dono do pedido
    /// </summary>
    public Guid MerchantId { get; set; }

    /// <summary>
    /// Cliente que fez o pedido (obrigatório)
    /// </summary>
    public Guid CustomerId { get; set; }

    /// <summary>
    /// Checkout de origem (opcional - null se criado via API direta)
    /// </summary>
    public Guid? CheckoutId { get; set; }

    /// <summary>
    /// Cupom aplicado (opcional)
    /// </summary>
    public Guid? CouponId { get; set; }

    /// <summary>
    /// Ambiente (Sandbox ou Production)
    /// </summary>
    public ApiEnvironment Environment { get; set; }

    /// <summary>
    /// Status do pedido
    /// </summary>
    public OrderStatus Status { get; set; } = OrderStatus.Pending;

    /// <summary>
    /// Status de fulfillment (preparação/entrega)
    /// </summary>
    public OrderFulfillmentStatus FulfillmentStatus { get; set; } = OrderFulfillmentStatus.Unfulfilled;

    /// <summary>
    /// Subtotal (soma dos itens) em centavos
    /// </summary>
    public long SubtotalAmount { get; set; }

    /// <summary>
    /// Valor do desconto (cupom) em centavos
    /// </summary>
    public long DiscountAmount { get; set; }

    /// <summary>
    /// Valor do frete em centavos
    /// </summary>
    public long ShippingAmount { get; set; }

    /// <summary>
    /// Valor total (Subtotal - Desconto + Frete) em centavos
    /// </summary>
    public long TotalAmount { get; set; }

    /// <summary>
    /// Código do cupom aplicado (snapshot para histórico)
    /// </summary>
    [MaxLength(50)]
    public string? CouponCode { get; set; }

    /// <summary>
    /// Observações do cliente sobre o pedido
    /// </summary>
    [MaxLength(1000)]
    public string? Notes { get; set; }

    /// <summary>
    /// Endereço de entrega (JSONB)
    /// </summary>
    [Column(TypeName = "jsonb")]
    public OrderShippingAddress? ShippingAddress { get; set; }

    /// <summary>
    /// Número do pedido para exibição (gerado automaticamente)
    /// </summary>
    [MaxLength(20)]
    public string? OrderNumber { get; set; }

    /// <summary>
    /// Identificador da sessão do checkout (para upsert de carrinho)
    /// </summary>
    [MaxLength(100)]
    public string? SessionId { get; set; }

    /// <summary>
    /// Data de quando o estoque foi reservado
    /// </summary>
    public DateTime? ReservedAt { get; set; }

    /// <summary>
    /// Data de expiração da reserva (backend: +20min)
    /// </summary>
    public DateTime? ExpiresAt { get; set; }

    /// <summary>
    /// Data de expiração para exibição no frontend (frontend: +15min)
    /// </summary>
    public DateTime? DisplayExpiresAt { get; set; }

    /// <summary>
    /// Método de pagamento selecionado pelo cliente (para orders em status Reserved)
    /// </summary>
    public PaymentMethod? SelectedPaymentMethod { get; set; }

    /// <summary>
    /// Data de criação
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Data de última atualização
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    // Navegações
    public virtual Merchant Merchant { get; set; } = null!;
    public virtual Customer Customer { get; set; } = null!;
    public virtual Checkout? Checkout { get; set; }
    public virtual Coupon? Coupon { get; set; }
    public virtual Payment? Payment { get; set; }
    public virtual ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}

/// <summary>
/// Endereço de entrega do pedido
/// </summary>
public class OrderShippingAddress
{
    public string? Street { get; set; }
    public string? Number { get; set; }
    public string? Complement { get; set; }
    public string? Neighborhood { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? ZipCode { get; set; }
    public string? Country { get; set; } = "BR";
}
