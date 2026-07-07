using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Models.Database;

/// <summary>
/// Variante de um produto físico (cor, tamanho, etc)
/// </summary>
public class PhysicalProductVariant : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    /// <summary>
    /// Produto pai
    /// </summary>
    public Guid PhysicalProductId { get; set; }

    /// <summary>
    /// Nome da variante (ex: "Azul - P", "Vermelho - M")
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
    /// Quantidade em estoque (null = estoque infinito)
    /// </summary>
    public int? StockQuantity { get; set; }

    /// <summary>
    /// URL da imagem da variante
    /// </summary>
    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    /// <summary>
    /// Status da variante
    /// </summary>
    public VariantStatus Status { get; set; } = VariantStatus.Active;

    // === Campos para cálculo de frete (override do produto) ===

    /// <summary>
    /// Peso em gramas (se diferente do produto)
    /// </summary>
    public int? WeightGrams { get; set; }

    /// <summary>
    /// Comprimento em cm (se diferente do produto)
    /// </summary>
    public decimal? LengthCm { get; set; }

    /// <summary>
    /// Largura em cm (se diferente do produto)
    /// </summary>
    public decimal? WidthCm { get; set; }

    /// <summary>
    /// Altura em cm (se diferente do produto)
    /// </summary>
    public decimal? HeightCm { get; set; }

    // Navegações
    public virtual PhysicalProduct PhysicalProduct { get; set; } = null!;
}
