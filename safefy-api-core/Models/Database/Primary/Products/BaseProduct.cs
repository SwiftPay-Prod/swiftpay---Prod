using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using safefy_api_core.Models.Enum;

namespace safefy_api_core.Models.Database;

/// <summary>
/// Classe base abstrata para todos os tipos de produto.
/// Utiliza estratégia TPC (Table Per Concrete) no EF Core.
/// </summary>
public abstract class BaseProduct : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    /// <summary>
    /// Merchant dono do produto
    /// </summary>
    public Guid MerchantId { get; set; }

    /// <summary>
    /// Nome do produto
    /// </summary>
    [MaxLength(200)]
    public string Name { get; set; } = null!;

    /// <summary>
    /// Descrição do produto
    /// </summary>
    [MaxLength(5000)]
    public string? Description { get; set; }

    /// <summary>
    /// SKU do produto (código de referência)
    /// </summary>
    [MaxLength(100)]
    public string? Sku { get; set; }

    /// <summary>
    /// ID externo para integração
    /// </summary>
    [MaxLength(100)]
    public string? ExternalId { get; set; }

    /// <summary>
    /// URL da imagem principal (primeira de ImageUrls)
    /// </summary>
    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    /// <summary>
    /// URLs das imagens do produto (até 6)
    /// </summary>
    [Column(TypeName = "jsonb")]
    public List<string> ImageUrls { get; set; } = [];

    /// <summary>
    /// Status do produto
    /// </summary>
    public ProductStatus Status { get; set; } = ProductStatus.Active;

    /// <summary>
    /// Ambiente (Sandbox ou Production)
    /// </summary>
    public ApiEnvironment Environment { get; set; } = ApiEnvironment.Production;

    /// <summary>
    /// Ordem de exibição (menor = primeiro)
    /// </summary>
    public int SortOrder { get; set; } = 0;

    /// <summary>
    /// Se o produto está visível no checkout
    /// </summary>
    public bool IsVisible { get; set; } = true;

    // Navegações
    public virtual Merchant Merchant { get; set; } = null!;
}
