using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Models.Database;

/// <summary>
/// Inscrição para notificação de disponibilidade de estoque
/// Quando um cliente quer ser avisado quando um produto voltar ao estoque
/// </summary>
public class StockNotificationSubscription : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    /// <summary>
    /// Merchant dono do produto
    /// </summary>
    public Guid MerchantId { get; set; }

    /// <summary>
    /// Produto que o cliente quer ser notificado
    /// </summary>
    public Guid ProductId { get; set; }

    /// <summary>
    /// Variante específica (opcional)
    /// </summary>
    public Guid? VariantId { get; set; }

    /// <summary>
    /// Ambiente
    /// </summary>
    public ApiEnvironment Environment { get; set; } = ApiEnvironment.Production;

    /// <summary>
    /// Email do cliente para notificação
    /// </summary>
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Nome do cliente (opcional)
    /// </summary>
    [MaxLength(100)]
    public string? Name { get; set; }

    /// <summary>
    /// Data que o cliente foi notificado (null = ainda não notificado)
    /// </summary>
    public DateTime? NotifiedAt { get; set; }

    /// <summary>
    /// Se a inscrição está ativa (pode ser desativada após notificar)
    /// </summary>
    public bool IsActive { get; set; } = true;

    // Navegações
    public virtual Merchant Merchant { get; set; } = null!;
    public virtual Product Product { get; set; } = null!;
    public virtual Variant? Variant { get; set; }
}
