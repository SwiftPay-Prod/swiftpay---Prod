using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Interfaces;

/// <summary>
/// Serviço para renderização e envio de emails usando templates de blocos
/// </summary>
public interface IEmailTemplateService
{
    /// <summary>
    /// Envia email usando o template especificado.
    /// Variáveis são preenchidas automaticamente conforme o tipo do template.
    /// Variáveis não aplicáveis ao tipo são ignoradas.
    /// </summary>
    Task<EmailSendResult> SendAsync(
        MerchantEmailTemplateType type,
        EmailTemplateContext context,
        CancellationToken ct = default);

    /// <summary>
    /// Verifica se o email do cliente é novo para o merchant (para Welcome email)
    /// </summary>
    Task<bool> IsNewCustomerAsync(
        Guid merchantId,
        string customerEmail,
        CancellationToken ct = default);
}

/// <summary>
/// Contexto para envio de emails de template.
/// Preencha os campos relevantes para o tipo de template que será enviado.
/// Campos não utilizados pelo tipo de template são ignorados.
/// </summary>
public sealed class EmailTemplateContext
{
    // ==================== CAMPOS OBRIGATÓRIOS ====================
    public required Guid MerchantId { get; set; }
    public required ApiEnvironment Environment { get; set; }
    public required string CustomerEmail { get; set; }
    
    // ==================== CAMPOS COMUNS ====================
    public string? CustomerName { get; set; }
    public string? MerchantName { get; set; }
    public string? MerchantLogoUrl { get; set; }
    
    // ==================== CAMPOS DE PEDIDO ====================
    // Usados em: PaymentConfirmation, OrderShipped, OrderDelivered, AbandonedCart
    public string? OrderNumber { get; set; }
    public DateTime? OrderDate { get; set; }
    public long? OrderTotal { get; set; }
    public long? OrderSubtotal { get; set; }
    public long? OrderShipping { get; set; }
    public long? OrderDiscount { get; set; }
    public string? PaymentMethod { get; set; }
    public List<OrderItemInfo>? OrderItems { get; set; }
    
    // ==================== CAMPOS DE ENTREGA DIGITAL ====================
    // Usados em: DigitalDelivery
    public List<DigitalDeliveryItem>? DigitalItems { get; set; }
    
    // ==================== CAMPOS DE RASTREAMENTO ====================
    // Usados em: OrderShipped
    public TrackingInfo? Tracking { get; set; }
    
    // ==================== CAMPOS DE ENTREGA ====================
    // Usados em: OrderDelivered
    public DateTime? DeliveryDate { get; set; }
    
    // ==================== CAMPOS DE CARRINHO ABANDONADO ====================
    // Usados em: AbandonedCart
    public string? CheckoutUrl { get; set; }
    public int? CartItemsCount { get; set; }
}

/// <summary>
/// Informações de um item do pedido para renderização
/// </summary>
public sealed class OrderItemInfo
{
    public required string ProductName { get; set; }
    public string? VariantName { get; set; }
    public int Quantity { get; set; }
    public long UnitPrice { get; set; }
    public long TotalPrice { get; set; }
    public string? ImageUrl { get; set; }
}

/// <summary>
/// Item digital para entrega (cada produto com seus itens entregues)
/// </summary>
public sealed class DigitalDeliveryItem
{
    public required string ProductName { get; set; }
    public string? VariantName { get; set; }
    public int Quantity { get; set; }
    public long UnitPrice { get; set; }
    public long TotalPrice { get; set; }
    public string? ImageUrl { get; set; }
    public List<DigitalItemContent> Items { get; set; } = [];
}

/// <summary>
/// Conteúdo de um item digital individual
/// </summary>
public sealed class DigitalItemContent
{
    public string? Label { get; set; }
    public required string Content { get; set; }
}

/// <summary>
/// Informações de rastreamento
/// </summary>
public sealed class TrackingInfo
{
    public required string CarrierName { get; set; }
    public required string TrackingCode { get; set; }
    public string? TrackingUrl { get; set; }
    public DateTime? EstimatedDelivery { get; set; }
}

/// <summary>
/// Resultado do envio de email
/// </summary>
public sealed class EmailSendResult
{
    public bool Success { get; set; }
    public bool TemplateDisabled { get; set; }
    public bool TemplateNotFound { get; set; }
    public string? ErrorMessage { get; set; }
    
    public static EmailSendResult Ok() => new() { Success = true };
    public static EmailSendResult Disabled() => new() { Success = false, TemplateDisabled = true };
    public static EmailSendResult NotFound() => new() { Success = false, TemplateNotFound = true };
    public static EmailSendResult Error(string message) => new() { Success = false, ErrorMessage = message };
}
