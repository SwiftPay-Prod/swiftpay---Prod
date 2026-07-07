using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace swiftpay_api_core.Models.Database;

public class LedgerTransaction : BaseEntity
{
    public LedgerTransaction()
    {
        Id = $"tx-{Guid.NewGuid()}";
    }

    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public string Id { get; set; }
    public long Amount { get; set; }
    public LedgerTransactionOperation Operation { get; set; }
    public LedgerTransactionStatus Status { get; set; }

    /// <summary>
    /// ID do pagamento associado (quando aplicável)
    /// </summary>
    public Guid? PaymentId { get; set; }

    /// <summary>
    /// ID do saque associado (quando aplicável)
    /// </summary>
    public Guid? PayoutId { get; set; }

    /// <summary>
    /// ID do saque da plataforma associado (quando aplicável)
    /// </summary>
    public Guid? PlatformPayoutId { get; set; }

    /// <summary>
    /// ID do item do saque da plataforma (quando aplicável)
    /// Usado para deduplicação quando múltiplos itens do mesmo payout falham
    /// </summary>
    public Guid? PlatformPayoutItemId { get; set; }

    /// <summary>
    /// Notas ou observações sobre a transação (ex: motivo de estorno)
    /// </summary>
    public string? Notes { get; set; }

    // Relationships
    public Payment? Payment { get; set; }
    public Payout? Payout { get; set; }
    public PlatformPayout? PlatformPayout { get; set; }
    public ICollection<LedgerEntry> LedgerEntries { get; set; } = [];
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum LedgerTransactionOperation
{
    // Fee
    PlatformFee,

    // Settlement
    SettlementIn,
    SettlementOut,

    // Merchant
    PayOut,

    // Referral
    ReferralCommissionPayOut,

    // Platform
    PlatformPayOutRequested,
    PlatformPayOut,

    // In
    PixIn,

    // Out
    PixOut,

    // Refund
    PixRefund,

    // Partial Refund
    PixPartialRefund,

    // Reversal (estorno de correção)
    Reversal,

    // Ajuste manual de saldo da plataforma
    PlatformAdjustment,

    // Ajuste manual de saldo da adquirente (conciliação)
    AcquirerAdjustment,

    // Ajuste manual de lucro Safefy na adquirente (com contrapartida na plataforma)
    AcquirerSafefyProfitAdjustment,

    // Ajuste manual de saldo do merchant (com contrapartida na plataforma)
    MerchantAdjustment
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum LedgerTransactionStatus
{
    Pending,
    AwaitingBankProcessing,
    Approved,
    Refused,
    Failed,
    /// <summary>
    /// Transação foi estornada por uma correção de reconciliação
    /// </summary>
    Reversed
}

/// <summary>
/// Deltas atômicos para atualização dos KPIs do MerchantBalance dentro da transação SQL.
/// Usados em vez de EF Update() para evitar race conditions last-write-wins em alto volume.
/// </summary>
public sealed class MerchantBalanceDeltas
{
    public required Guid MerchantId { get; init; }
    public required Models.Enum.ApiEnvironment Environment { get; init; }
    public long LifetimeVolumeDelta { get; init; }
    public long LifetimeFeesPaidDelta { get; init; }
    public long LifetimePayoutsDelta { get; init; }
    public long LifetimeRefundsDelta { get; init; }
    public long VolumeTodayDelta { get; init; }
    public long VolumeThisWeekDelta { get; init; }
    public long VolumeThisMonthDelta { get; init; }
}