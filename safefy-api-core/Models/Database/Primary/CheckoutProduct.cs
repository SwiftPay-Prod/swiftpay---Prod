using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace safefy_api_core.Models.Database;

/// <summary>
/// Tabela de junção N:M entre Checkout e Product.
/// Permite configurar ordem de exibição e preço customizado por checkout.
/// </summary>
public class CheckoutProduct : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }
    
    public Guid CheckoutId { get; set; }
    
    public Guid ProductId { get; set; }
    
    /// <summary>
    /// ID da variante (opcional, se o checkout usa uma variante específica)
    /// </summary>
    public Guid? VariantId { get; set; }
    
    /// <summary>
    /// Ordem de exibição do produto no checkout
    /// </summary>
    public int DisplayOrder { get; set; } = 0;
    
    /// <summary>
    /// Preço customizado em centavos (se null, usa o preço do produto/variante)
    /// </summary>
    public long? CustomPrice { get; set; }
    
    /// <summary>
    /// Quantidade pré-definida (para SingleOrder) ou quantidade mínima (para Catalog)
    /// </summary>
    public int Quantity { get; set; } = 1;
    
    /// <summary>
    /// Quantidade máxima permitida (para Catalog, null = ilimitado)
    /// </summary>
    public int? MaxQuantity { get; set; }
    
    /// <summary>
    /// Se o produto está ativo neste checkout
    /// </summary>
    public bool IsActive { get; set; } = true;
    
    // Relationships
    public Checkout Checkout { get; set; } = null!;
    public Product Product { get; set; } = null!;
    public Variant? Variant { get; set; }
}
