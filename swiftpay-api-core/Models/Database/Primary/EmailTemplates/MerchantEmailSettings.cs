using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Models.Database;

/// <summary>
/// Configurações de email do merchant para envio de templates customizados
/// </summary>
public class MerchantEmailSettings : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    /// <summary>
    /// Merchant dono das configurações
    /// </summary>
    public Guid MerchantId { get; set; }

    /// <summary>
    /// Ambiente (Sandbox ou Production)
    /// </summary>
    public ApiEnvironment Environment { get; set; }

    /// <summary>
    /// Email remetente (From)
    /// Deve ser um email verificado no Resend
    /// </summary>
    [MaxLength(200)]
    public string? FromEmail { get; set; }

    /// <summary>
    /// Nome do remetente (From Name)
    /// </summary>
    [MaxLength(100)]
    public string? FromName { get; set; }

    /// <summary>
    /// Email para respostas (Reply-To)
    /// </summary>
    [MaxLength(200)]
    public string? ReplyToEmail { get; set; }

    /// <summary>
    /// API Key do Resend do merchant (opcional)
    /// Se não configurado, usa a API Key da plataforma
    /// </summary>
    [MaxLength(500)]
    public string? ResendApiKey { get; set; }

    /// <summary>
    /// Domínio verificado no Resend (opcional)
    /// Ex: "mail.merchant.com"
    /// </summary>
    [MaxLength(200)]
    public string? VerifiedDomain { get; set; }

    /// <summary>
    /// Se as configurações de email estão ativas
    /// </summary>
    public bool IsActive { get; set; } = true;

    // Navegações
    public virtual Merchant Merchant { get; set; } = null!;
}
