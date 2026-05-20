using safefy_api_core.Models.Enum;

namespace safefy_api_core.Models.Email;

/// <summary>
/// Variável disponível para uso em templates de email
/// </summary>
public class EmailTemplateVariable
{
    /// <summary>
    /// Nome da variável (ex: "customer_name")
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Descrição da variável
    /// </summary>
    public string Description { get; set; } = null!;

    /// <summary>
    /// Exemplo de valor
    /// </summary>
    public string Example { get; set; } = null!;

    /// <summary>
    /// Categoria da variável
    /// </summary>
    public string Category { get; set; } = null!;
}

/// <summary>
/// Constantes com as variáveis disponíveis por tipo de template
/// </summary>
public static class EmailTemplateVariables
{
    /// <summary>
    /// Variáveis comuns a todos os templates
    /// </summary>
    public static readonly List<EmailTemplateVariable> Common =
    [
        new() { Name = "customer_name", Description = "Nome do cliente", Example = "João Silva", Category = "Cliente" },
        new() { Name = "customer_email", Description = "Email do cliente", Example = "joao@email.com", Category = "Cliente" },
        new() { Name = "customer_phone", Description = "Telefone do cliente", Example = "(11) 99999-9999", Category = "Cliente" },
        new() { Name = "merchant_name", Description = "Nome da loja", Example = "Minha Loja", Category = "Loja" },
        new() { Name = "merchant_logo", Description = "URL do logo da loja", Example = "https://...", Category = "Loja" },
        new() { Name = "current_year", Description = "Ano atual", Example = "2026", Category = "Sistema" },
    ];

    /// <summary>
    /// Variáveis de pedido
    /// </summary>
    public static readonly List<EmailTemplateVariable> Order =
    [
        new() { Name = "order_number", Description = "Número do pedido", Example = "ORD-20260203-0001", Category = "Pedido" },
        new() { Name = "order_date", Description = "Data do pedido", Example = "03/02/2026", Category = "Pedido" },
        new() { Name = "order_total", Description = "Valor total do pedido", Example = "R$ 99,90", Category = "Pedido" },
        new() { Name = "order_subtotal", Description = "Subtotal do pedido", Example = "R$ 89,90", Category = "Pedido" },
        new() { Name = "order_shipping", Description = "Valor do frete", Example = "R$ 10,00", Category = "Pedido" },
        new() { Name = "order_discount", Description = "Valor do desconto", Example = "R$ 0,00", Category = "Pedido" },
        new() { Name = "payment_method", Description = "Método de pagamento", Example = "PIX", Category = "Pagamento" },
    ];

    /// <summary>
    /// Variáveis específicas de entrega digital
    /// </summary>
    public static readonly List<EmailTemplateVariable> DigitalDelivery =
    [
        new() { Name = "digital_items", Description = "Lista de itens digitais (renderizado automaticamente)", Example = "[Lista de chaves/links]", Category = "Digital" },
        new() { Name = "digital_items_count", Description = "Quantidade de itens digitais", Example = "3", Category = "Digital" },
    ];

    /// <summary>
    /// Variáveis específicas de envio
    /// </summary>
    public static readonly List<EmailTemplateVariable> Shipping =
    [
        new() { Name = "tracking_code", Description = "Código de rastreamento", Example = "BR123456789BR", Category = "Envio" },
        new() { Name = "tracking_url", Description = "URL de rastreamento", Example = "https://...", Category = "Envio" },
        new() { Name = "carrier_name", Description = "Nome da transportadora", Example = "Correios", Category = "Envio" },
        new() { Name = "estimated_delivery", Description = "Previsão de entrega", Example = "05/02/2026", Category = "Envio" },
        new() { Name = "shipping_address", Description = "Endereço de entrega", Example = "Rua X, 123 - São Paulo, SP", Category = "Envio" },
    ];

    /// <summary>
    /// Variáveis específicas de entrega confirmada
    /// </summary>
    public static readonly List<EmailTemplateVariable> Delivered =
    [
        new() { Name = "delivery_date", Description = "Data de entrega", Example = "05/02/2026", Category = "Entrega" },
        new() { Name = "delivered_to", Description = "Quem recebeu", Example = "João Silva", Category = "Entrega" },
    ];

    /// <summary>
    /// Variáveis específicas de boas-vindas
    /// </summary>
    public static readonly List<EmailTemplateVariable> Welcome =
    [
        new() { Name = "registration_date", Description = "Data de cadastro", Example = "03/02/2026", Category = "Cadastro" },
    ];

    /// <summary>
    /// Variáveis específicas de carrinho abandonado
    /// </summary>
    public static readonly List<EmailTemplateVariable> AbandonedCart =
    [
        new() { Name = "cart_items", Description = "Lista de itens no carrinho (renderizado automaticamente)", Example = "[Lista de produtos]", Category = "Carrinho" },
        new() { Name = "cart_total", Description = "Valor total do carrinho", Example = "R$ 199,90", Category = "Carrinho" },
        new() { Name = "cart_items_count", Description = "Quantidade de itens no carrinho", Example = "3", Category = "Carrinho" },
        new() { Name = "checkout_url", Description = "URL para retomar a compra", Example = "https://...", Category = "Carrinho" },
    ];

    /// <summary>
    /// Retorna todas as variáveis disponíveis para um tipo de template
    /// </summary>
    public static List<EmailTemplateVariable> GetVariablesForTemplate(MerchantEmailTemplateType type)
    {
        var variables = new List<EmailTemplateVariable>();
        variables.AddRange(Common);

        switch (type)
        {
            case MerchantEmailTemplateType.PaymentConfirmation:
                variables.AddRange(Order);
                break;

            case MerchantEmailTemplateType.DigitalDelivery:
                variables.AddRange(Order);
                variables.AddRange(DigitalDelivery);
                break;

            case MerchantEmailTemplateType.OrderShipped:
                variables.AddRange(Order);
                variables.AddRange(Shipping);
                break;

            case MerchantEmailTemplateType.OrderDelivered:
                variables.AddRange(Order);
                variables.AddRange(Shipping);
                variables.AddRange(Delivered);
                break;

            case MerchantEmailTemplateType.Welcome:
                variables.AddRange(Welcome);
                break;

            case MerchantEmailTemplateType.AbandonedCart:
                variables.AddRange(AbandonedCart);
                break;
        }

        return variables;
    }
}
