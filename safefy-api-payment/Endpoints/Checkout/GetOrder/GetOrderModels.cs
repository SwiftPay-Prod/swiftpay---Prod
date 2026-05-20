using FastEndpoints;
using FluentValidation;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_payment.Endpoints.Models;

namespace safefy_api_payment.Endpoints.Checkout.GetOrder;

/// <summary>
/// Request para obter pedido do checkout.
/// </summary>
public sealed class GetOrderRequest
{
    /// <summary>
    /// ShortId do checkout (na URL).
    /// </summary>
    public string ShortId { get; set; } = string.Empty;

    /// <summary>
    /// ID do pedido (na URL).
    /// </summary>
    public Guid OrderId { get; set; }
}

/// <summary>
/// Validador do request.
/// </summary>
public sealed class GetOrderRequestValidator : Validator<GetOrderRequest>
{
    public GetOrderRequestValidator()
    {
        RuleFor(x => x.ShortId)
            .NotEmpty().WithMessage("O identificador do checkout é obrigatório.");

        RuleFor(x => x.OrderId)
            .NotEmpty().WithMessage("O identificador do pedido é obrigatório.");
    }
}

/// <summary>
/// Response da obtenção do pedido.
/// </summary>
public sealed class GetOrderResponse : BaseResponse<GetOrderData>;

/// <summary>
/// Dados do pedido.
/// </summary>
public sealed class GetOrderData
{
    /// <summary>
    /// ID do pedido.
    /// </summary>
    public Guid OrderId { get; set; }

    /// <summary>
    /// Número do pedido (ex: ORD-20250125-0001-12).
    /// </summary>
    public string OrderNumber { get; set; } = string.Empty;

    /// <summary>
    /// Status do pedido.
    /// </summary>
    public OrderStatus OrderStatus { get; set; }

    /// <summary>
    /// ID do pagamento (null se Reserved).
    /// </summary>
    public Guid? PaymentId { get; set; }

    /// <summary>
    /// ID externo do pagamento.
    /// </summary>
    public string? ExternalId { get; set; }

    /// <summary>
    /// Método de pagamento (do Payment, se existir).
    /// </summary>
    public PaymentMethod? Method { get; set; }

    /// <summary>
    /// Método de pagamento selecionado (do Order, para pedidos em Reserved).
    /// </summary>
    public PaymentMethod? SelectedPaymentMethod { get; set; }

    /// <summary>
    /// Valor total em centavos.
    /// </summary>
    public long Amount { get; set; }

    /// <summary>
    /// Moeda.
    /// </summary>
    public string? Currency { get; set; }

    /// <summary>
    /// Status do pagamento (null se Reserved).
    /// </summary>
    public PaymentStatus? Status { get; set; }

    /// <summary>
    /// Descrição.
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Ambiente.
    /// </summary>
    public ApiEnvironment? Environment { get; set; }

    /// <summary>
    /// Data de expiração da reserva/pagamento.
    /// </summary>
    public DateTime? ExpiresAt { get; set; }

    /// <summary>
    /// Data de expiração exibida para o cliente.
    /// </summary>
    public DateTime? DisplayExpiresAt { get; set; }

    /// <summary>
    /// Data de criação.
    /// </summary>
    public DateTime? CreatedAt { get; set; }

    /// <summary>
    /// Data de conclusão.
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// ID do cliente.
    /// </summary>
    public Guid? CustomerId { get; set; }

    /// <summary>
    /// Código do cupom salvo (para preencher campo na recuperação).
    /// </summary>
    public string? CouponCode { get; set; }

    /// <summary>
    /// Dados do cliente (para recuperação de formulário).
    /// </summary>
    public GetOrderCustomerData? Customer { get; set; }

    /// <summary>
    /// Endereco de entrega (para recuperação de formulário).
    /// </summary>
    public GetOrderAddressData? ShippingAddress { get; set; }

    /// <summary>
    /// Itens do pedido (para recuperação de variantes).
    /// </summary>
    public List<GetOrderItemData>? Items { get; set; }

    /// <summary>
    /// Dados do PIX (se método for PIX).
    /// </summary>
    public GetOrderPixData? Pix { get; set; }

    /// <summary>
    /// Dados do boleto (se método for boleto).
    /// </summary>
    public GetOrderBoletoData? Boleto { get; set; }
}

/// <summary>
/// Dados do cliente no pedido.
/// </summary>
public sealed class GetOrderCustomerData
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Document { get; set; }
}

/// <summary>
/// Dados de item do pedido.
/// </summary>
public sealed class GetOrderItemData
{
    public Guid ProductId { get; set; }
    public Guid? VariantId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? VariantName { get; set; }
    public int Quantity { get; set; }
    public long UnitPrice { get; set; }
    public long TotalPrice { get; set; }
    public bool IsInStock { get; set; }
    public int? StockQuantity { get; set; }
}

/// <summary>
/// Dados do endereço no pedido.
/// </summary>
public sealed class GetOrderAddressData
{
    public string? Street { get; set; }
    public string? Number { get; set; }
    public string? Complement { get; set; }
    public string? Neighborhood { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? ZipCode { get; set; }
    public string? Country { get; set; }
}

/// <summary>
/// Dados do PIX no pedido.
/// </summary>
public sealed class GetOrderPixData
{
    /// <summary>
    /// ID da transação PIX.
    /// </summary>
    public string? TxId { get; set; }

    /// <summary>
    /// QR Code em base64.
    /// </summary>
    public string? QrCode { get; set; }

    /// <summary>
    /// Código PIX copia e cola.
    /// </summary>
    public string? CopyAndPaste { get; set; }

    /// <summary>
    /// Data de expiração do PIX.
    /// </summary>
    public DateTime? ExpiresAt { get; set; }
}

/// <summary>
/// Dados do boleto no pedido.
/// </summary>
public sealed class GetOrderBoletoData
{
    /// <summary>
    /// Código de barras.
    /// </summary>
    public string? Barcode { get; set; }

    /// <summary>
    /// Linha digitável.
    /// </summary>
    public string? DigitableLine { get; set; }

    /// <summary>
    /// URL do PDF do boleto.
    /// </summary>
    public string? PdfUrl { get; set; }

    /// <summary>
    /// Data de vencimento.
    /// </summary>
    public DateTime? DueDate { get; set; }
}
