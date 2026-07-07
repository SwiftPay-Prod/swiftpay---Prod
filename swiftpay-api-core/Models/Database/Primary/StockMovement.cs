using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Models.Database;

/// <summary>
/// Registro de movimentação de estoque para auditoria
/// </summary>
public class StockMovement
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    /// <summary>
    /// Merchant dono do produto
    /// </summary>
    public Guid MerchantId { get; set; }

    /// <summary>
    /// Produto afetado
    /// </summary>
    public Guid ProductId { get; set; }

    /// <summary>
    /// Variante afetada (opcional - null se produto sem variante)
    /// </summary>
    public Guid? VariantId { get; set; }

    /// <summary>
    /// Tipo da movimentação
    /// </summary>
    public StockMovementType Type { get; set; }

    /// <summary>
    /// Quantidade movimentada (positivo = entrada, negativo = saída)
    /// </summary>
    public int Quantity { get; set; }

    /// <summary>
    /// Tipo de referência da movimentação
    /// </summary>
    public StockMovementReferenceType ReferenceType { get; set; }

    /// <summary>
    /// ID da referência (OrderId, etc.)
    /// </summary>
    public Guid? ReferenceId { get; set; }

    /// <summary>
    /// Saldo antes da movimentação
    /// </summary>
    public int BalanceBefore { get; set; }

    /// <summary>
    /// Saldo após a movimentação
    /// </summary>
    public int BalanceAfter { get; set; }

    /// <summary>
    /// Observações da movimentação
    /// </summary>
    [MaxLength(500)]
    public string? Notes { get; set; }

    /// <summary>
    /// Ambiente (Sandbox ou Production)
    /// </summary>
    public ApiEnvironment Environment { get; set; }

    /// <summary>
    /// Data da movimentação
    /// </summary>
    public DateTime CreatedAt { get; set; }

    // Navegações
    public virtual Merchant Merchant { get; set; } = null!;
    public virtual Product Product { get; set; } = null!;
    public virtual Variant? Variant { get; set; }
}
