using System.ComponentModel.DataAnnotations.Schema;

namespace safefy_api_core.Models.Database;

/// <summary>
/// Produto digital - entrega automática via chaves, links, etc
/// </summary>
public class DigitalProduct : BaseProduct
{
    /// <summary>
    /// Preço em centavos
    /// </summary>
    public long Price { get; set; }

    /// <summary>
    /// Preço comparativo/riscado em centavos (para mostrar desconto)
    /// </summary>
    public long? CompareAtPrice { get; set; }

    /// <summary>
    /// Quantidade de itens digitais a entregar por compra
    /// </summary>
    public int ItemsPerPurchase { get; set; } = 1;

    /// <summary>
    /// Entrega automática após confirmação do pagamento
    /// </summary>
    public bool AutoDelivery { get; set; } = true;

    /// <summary>
    /// Se o produto tem variantes (edições, versões, etc)
    /// </summary>
    public bool HasVariants { get; set; } = false;

    // Navegações
    public virtual ICollection<DigitalProductVariant> Variants { get; set; } = [];
    public virtual ICollection<DigitalProductItem> Items { get; set; } = [];
    public virtual ICollection<Category> Categories { get; set; } = [];
}
