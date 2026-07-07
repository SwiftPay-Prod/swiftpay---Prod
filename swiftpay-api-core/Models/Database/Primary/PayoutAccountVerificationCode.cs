using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace swiftpay_api_core.Models.Database;

/// <summary>
/// Código de verificação para ações em contas de saque.
/// Similar ao MerchantDeletionCode.
/// </summary>
public class PayoutAccountVerificationCode : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    /// <summary>
    /// Conta de saque que está sendo verificada
    /// </summary>
    public Guid MerchantPayoutAccountId { get; set; }

    /// <summary>
    /// Usuário que solicitou a verificação
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// Hash SHA256 do código de 6 dígitos
    /// </summary>
    public required string CodeHash { get; set; }

    /// <summary>
    /// Tipo de ação que o código autoriza
    /// </summary>
    public PayoutAccountActionType ActionType { get; set; } = PayoutAccountActionType.Activate;

    /// <summary>
    /// Status do código de verificação
    /// </summary>
    public PayoutAccountVerificationCodeStatus Status { get; set; } = PayoutAccountVerificationCodeStatus.Pending;

    /// <summary>
    /// Data/hora de expiração (15 minutos após criação)
    /// </summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// Verifica se o código expirou
    /// </summary>
    [NotMapped]
    public bool IsExpired => DateTime.UtcNow > ExpiresAt;

    /// <summary>
    /// Verifica se o código é válido (pendente e não expirado)
    /// </summary>
    [NotMapped]
    public bool IsValid => Status == PayoutAccountVerificationCodeStatus.Pending && !IsExpired;

    // Relationships
    public MerchantPayoutAccount PayoutAccount { get; set; } = null!;
    public User User { get; set; } = null!;
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum PayoutAccountActionType
{
    /// <summary>
    /// Ativar conta de saque (verificação inicial)
    /// </summary>
    Activate,

    /// <summary>
    /// Definir conta como padrão
    /// </summary>
    SetDefault,

    /// <summary>
    /// Remover conta de saque
    /// </summary>
    Delete,

    /// <summary>
    /// Visualizar dados completos da conta (sem máscara)
    /// </summary>
    View
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum PayoutAccountVerificationCodeStatus
{
    /// <summary>
    /// Código pendente de uso
    /// </summary>
    Pending,

    /// <summary>
    /// Código utilizado com sucesso
    /// </summary>
    Used,

    /// <summary>
    /// Código expirado por tempo
    /// </summary>
    ExpiredByTime,

    /// <summary>
    /// Código invalidado por novo código gerado
    /// </summary>
    ExpiredByNewCode
}
