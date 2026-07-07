using System.ComponentModel.DataAnnotations.Schema;

namespace swiftpay_api_core.Models.Database;

/// <summary>
/// Produto físico - requer entrega/envio
/// </summary>
public class PhysicalProduct : BaseProduct
{
    /// <summary>
    /// Preço em centavos (usado quando não há variantes)
    /// </summary>
    public long? Price { get; set; }

    /// <summary>
    /// Preço comparativo/riscado em centavos (para mostrar desconto)
    /// </summary>
    public long? CompareAtPrice { get; set; }

    /// <summary>
    /// Quantidade em estoque (null = estoque infinito)
    /// Usado apenas quando não há variantes
    /// </summary>
    public int? StockQuantity { get; set; }

    /// <summary>
    /// Controlar estoque automaticamente
    /// </summary>
    public bool TrackInventory { get; set; } = true;

    /// <summary>
    /// Permitir venda mesmo sem estoque
    /// </summary>
    public bool AllowBackorder { get; set; } = false;

    /// <summary>
    /// Marca do produto
    /// </summary>
    public string? Brand { get; set; }

    // === Campos para cálculo de frete ===

    /// <summary>
    /// Peso em gramas
    /// </summary>
    public int? WeightGrams { get; set; }

    /// <summary>
    /// Comprimento em centímetros
    /// </summary>
    public decimal? LengthCm { get; set; }

    /// <summary>
    /// Largura em centímetros
    /// </summary>
    public decimal? WidthCm { get; set; }

    /// <summary>
    /// Altura em centímetros
    /// </summary>
    public decimal? HeightCm { get; set; }

    // === Variantes ===

    /// <summary>
    /// Se o produto tem variantes (cor, tamanho, etc)
    /// </summary>
    public bool HasVariants { get; set; } = false;

    // Navegações
    public virtual ICollection<PhysicalProductVariant> Variants { get; set; } = [];
    public virtual ICollection<Category> Categories { get; set; } = [];
}
