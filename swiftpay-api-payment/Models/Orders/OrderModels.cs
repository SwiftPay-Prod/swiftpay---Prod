using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_payment.Models.Orders;

/// <summary>
/// Input para criar um Order.
/// </summary>
public sealed class CreateOrderInput
{
    /// <summary>
    /// ID de uma reserva existente para reutilizar (ao invés de criar novo Order).
    /// </summary>
    public Guid? ExistingOrderId { get; set; }

    public required Guid MerchantId { get; set; }
    
    /// <summary>
    /// ID do usuário que está criando o pedido (quando criado via painel).
    /// </summary>
    public Guid? UserId { get; set; }
    
    /// <summary>
    /// ID do cliente que está fazendo o pedido.
    /// </summary>
    public required Guid CustomerId { get; set; }
    public required ApiEnvironment Environment { get; set; }

    /// <summary>
    /// CheckoutId (quando vem de um checkout e-commerce).
    /// </summary>
    public Guid? CheckoutId { get; set; }

    /// <summary>
    /// Modo da taxa adicional do template de checkout.
    /// Null indica que nao ha taxa adicional.
    /// </summary>
    public FeeChargeMode? CheckoutTemplateFeeMode { get; set; }

    /// <summary>
    /// Taxa fixa adicional do template em centavos.
    /// </summary>
    public long CheckoutTemplateFeeFixed { get; set; }

    /// <summary>
    /// Taxa percentual adicional do template em basis points.
    /// </summary>
    public int CheckoutTemplateFeePercentage { get; set; }

    /// <summary>
    /// Items do pedido.
    /// </summary>
    public required List<CreateOrderItemInput> Items { get; set; } = [];

    /// <summary>
    /// Código do cupom a aplicar.
    /// </summary>
    public string? CouponCode { get; set; }

    /// <summary>
    /// Valor do frete em centavos.
    /// </summary>
    public long ShippingAmount { get; set; }

    /// <summary>
    /// Endereço de entrega.
    /// </summary>
    public OrderShippingAddress? ShippingAddress { get; set; }

    /// <summary>
    /// Observações do pedido.
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Descrição para o Payment.
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Método de pagamento para criar o Payment automaticamente.
    /// </summary>
    public required PaymentMethod PaymentMethod { get; set; }

    /// <summary>
    /// URL de callback para webhook de pagamento.
    /// </summary>
    public string? CallbackUrl { get; set; }

    /// <summary>
    /// Origin da requisição HTTP (header Origin ou Referer).
    /// </summary>
    public string? RequestOrigin { get; set; }

    /// <summary>
    /// Metadados adicionais.
    /// </summary>
    public string? Metadata { get; set; }

    /// <summary>
    /// ID externo para referência.
    /// </summary>
    public string? ExternalId { get; set; }

    /// <summary>
    /// Minutos para expiração do pagamento PIX.
    /// </summary>
    public int? ExpirationMinutes { get; set; }

    /// <summary>
    /// Data de vencimento do boleto.
    /// </summary>
    public DateTime? BoletoDueDate { get; set; }

    /// <summary>
    /// Instruções do boleto.
    /// </summary>
    public string? BoletoInstructions { get; set; }
}

/// <summary>
/// Item do pedido no input.
/// </summary>
public sealed class CreateOrderItemInput
{
    public required Guid ProductId { get; set; }
    public Guid? VariantId { get; set; }
    public required int Quantity { get; set; }

    /// <summary>
    /// Preço unitário customizado (se não informado, usa preço do produto/variante).
    /// </summary>
    public long? UnitPrice { get; set; }
}

/// <summary>
/// Resultado de operações de Order.
/// </summary>
public sealed class OrderResult
{
    public bool Success { get; set; }
    public Order? Order { get; set; }
    public Payment? Payment { get; set; }
    public PaymentPix? PaymentPix { get; set; }
    public PaymentBoleto? PaymentBoleto { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
    public int StatusCode { get; set; } = 200;

    public static OrderResult Ok(Order order, Payment? payment = null, PaymentPix? paymentPix = null, PaymentBoleto? paymentBoleto = null) => new()
    {
        Success = true,
        Order = order,
        Payment = payment,
        PaymentPix = paymentPix,
        PaymentBoleto = paymentBoleto,
        StatusCode = 201
    };

    public static OrderResult Error(string message, string? code = null, int statusCode = 400) => new()
    {
        Success = false,
        ErrorMessage = message,
        ErrorCode = code,
        StatusCode = statusCode
    };
}
