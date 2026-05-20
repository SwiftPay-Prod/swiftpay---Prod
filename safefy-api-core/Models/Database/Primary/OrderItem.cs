using safefy_api_core.Models.Enum;
using System.ComponentModel.DataAnnotations;

namespace safefy_api_core.Models.Database;

/// <summary>
/// Item de um pedido - representa um produto/variante com quantidade e preço
/// </summary>
public class OrderItem
{
    [Key]
    public Guid Id { get; set; }

    /// <summary>
    /// Pedido pai
    /// </summary>
    public Guid OrderId { get; set; }

    /// <summary>
    /// Produto
    /// </summary>
    public Guid ProductId { get; set; }

    /// <summary>
    /// Variante do produto (opcional)
    /// </summary>
    public Guid? VariantId { get; set; }

    /// <summary>
    /// Nome do produto (snapshot para histórico)
    /// </summary>
    [MaxLength(200)]
    public string ProductName { get; set; } = string.Empty;

    /// <summary>
    /// Nome da variante (snapshot para histórico)
    /// </summary>
    [MaxLength(200)]
    public string? VariantName { get; set; }

    /// <summary>
    /// SKU do produto/variante (snapshot)
    /// </summary>
    [MaxLength(100)]
    public string? Sku { get; set; }

    /// <summary>
    /// URL da imagem do produto (snapshot)
    /// </summary>
    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    /// <summary>
    /// Quantidade
    /// </summary>
    public int Quantity { get; set; }

    /// <summary>
    /// Preço unitário em centavos (no momento da compra)
    /// </summary>
    public long UnitPrice { get; set; }

    /// <summary>
    /// Preço total (UnitPrice * Quantity) em centavos
    /// </summary>
    public long TotalPrice { get; set; }

    /// <summary>
    /// Data de criação
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Tipo do produto (snapshot para referência)
    /// </summary>
    public ProductType ProductType { get; set; }

    /// <summary>
    /// Data de entrega dos itens digitais (quando aplicável)
    /// </summary>
    public DateTime? DigitalItemsDeliveredAt { get; set; }

    // Navegações
    public virtual Order Order { get; set; } = null!;
    public virtual Product Product { get; set; } = null!;
    public virtual Variant? Variant { get; set; }
    public virtual ICollection<DigitalItem> DeliveredDigitalItems { get; set; } = [];
}
