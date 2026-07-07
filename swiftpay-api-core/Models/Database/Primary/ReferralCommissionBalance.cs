using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Models.Database;

public class ReferralCommissionBalance : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    public Guid ReferrerUserId { get; set; }
    public ApiEnvironment Environment { get; set; }

    /// <summary>
    /// Saldo atualmente disponível para saque de comissão (centavos).
    /// </summary>
    public long AvailableBalance { get; set; }

    /// <summary>
    /// Total histórico de comissão gerada (centavos).
    /// </summary>
    public long TotalGenerated { get; set; }

    /// <summary>
    /// Total histórico de comissão paga (centavos).
    /// </summary>
    public long TotalPaid { get; set; }

    /// <summary>
    /// Total bloqueado em solicitações de saque pendentes (centavos).
    /// </summary>
    public long TotalPendingWithdrawal { get; set; }

    public User ReferrerUser { get; set; } = null!;
}
