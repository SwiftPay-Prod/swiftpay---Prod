using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Models.Database;

/// <summary>
/// Variante de um produto digital (edição, versão, etc)
/// </summary>
public class DigitalProductVariant : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    /// <summary>
    /// Produto pai
    /// </summary>
    public Guid DigitalProductId { get; set; }

    /// <summary>
    /// Nome da variante (ex: "Edição Standard", "Edição Deluxe")
    /// </summary>
    [MaxLength(200)]
    public string Name { get; set; } = null!;

    /// <summary>
    /// ID externo para integração
    /// </summary>
    [MaxLength(100)]
    public string? ExternalId { get; set; }

    /// <summary>
    /// SKU da variante
    /// </summary>
    [MaxLength(100)]
    public string? Sku { get; set; }

    /// <summary>
    /// Preço em centavos
    /// </summary>
    public long Price { get; set; }

    /// <summary>
    /// Preço comparativo/riscado em centavos
    /// </summary>
    public long? CompareAtPrice { get; set; }

    /// <summary>
    /// URL da imagem da variante
    /// </summary>
    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    /// <summary>
    /// Status da variante
    /// </summary>
    public VariantStatus Status { get; set; } = VariantStatus.Active;

    /// <summary>
    /// Quantidade de itens digitais a entregar por compra desta variante
    /// </summary>
    public int ItemsPerPurchase { get; set; } = 1;

    // Navegações
    public virtual DigitalProduct DigitalProduct { get; set; } = null!;
    public virtual ICollection<DigitalProductItem> Items { get; set; } = [];
}
