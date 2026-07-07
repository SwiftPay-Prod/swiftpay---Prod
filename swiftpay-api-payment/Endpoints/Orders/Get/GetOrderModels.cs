using FastEndpoints;
using FluentValidation;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_payment.Endpoints.Models;

using ApiEnvironment = swiftpay_api_core.Models.Enum.ApiEnvironment;

namespace swiftpay_api_payment.Endpoints.Orders.Get;

/// <summary>
/// Request para obter detalhes de um pedido.
/// </summary>
public sealed class GetOrderRequest
{
    public Guid OrderId { get; set; }
}

public sealed class GetOrderRequestValidator : Validator<GetOrderRequest>
{
    public GetOrderRequestValidator()
    {
        RuleFor(x => x.OrderId)
            .NotEmpty().WithMessage("O ID do pedido é obrigatório.");
    }
}

/// <summary>
/// Response com detalhes do pedido.
/// </summary>
public sealed class GetOrderResponse : BaseResponse<GetOrderData>;

/// <summary>
/// Dados completos do pedido.
/// </summary>
public sealed class GetOrderData
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public OrderStatus Status { get; set; }
    public OrderFulfillmentStatus FulfillmentStatus { get; set; }
    public ApiEnvironment Environment { get; set; }
    public long SubtotalAmount { get; set; }
    public long DiscountAmount { get; set; }
    public long ShippingAmount { get; set; }
    public long TotalAmount { get; set; }
    public string? CouponCode { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public GetOrderCustomerData? Customer { get; set; }
    public GetOrderShippingAddressData? ShippingAddress { get; set; }
    public List<GetOrderItemData> Items { get; set; } = [];
    public GetOrderPaymentData? Payment { get; set; }
}

/// <summary>
/// Dados do cliente no pedido.
/// </summary>
public sealed class GetOrderCustomerData
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Document { get; set; }
}

/// <summary>
/// Endereço de entrega do pedido.
/// </summary>
public sealed class GetOrderShippingAddressData
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
/// Item do pedido.
/// </summary>
public sealed class GetOrderItemData
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public Guid? VariantId { get; set; }
    public string? VariantName { get; set; }
    public string? Sku { get; set; }
    public string? ImageUrl { get; set; }
    public int Quantity { get; set; }
    public long UnitPrice { get; set; }
    public long TotalPrice { get; set; }
}

/// <summary>
/// Dados do pagamento do pedido.
/// </summary>
public sealed class GetOrderPaymentData
{
    public Guid Id { get; set; }
    public PaymentStatus Status { get; set; }
    public PaymentMethod Method { get; set; }
    public long Amount { get; set; }
    public long Fee { get; set; }
    public long NetAmount { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }

    public GetOrderPixData? Pix { get; set; }
    public GetOrderBoletoData? Boleto { get; set; }
}

/// <summary>
/// Dados do PIX do pedido.
/// </summary>
public sealed class GetOrderPixData
{
    public string? TxId { get; set; }
    public string? QrCode { get; set; }
    public string? CopyAndPaste { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

/// <summary>
/// Dados do boleto do pedido.
/// </summary>
public sealed class GetOrderBoletoData
{
    public string? Barcode { get; set; }
    public string? DigitableLine { get; set; }
    public string? PdfUrl { get; set; }
    public DateTime? DueDate { get; set; }
}
