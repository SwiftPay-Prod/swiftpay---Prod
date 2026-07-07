using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace swiftpay_api_core.Models.Database;

/// <summary>
/// Tipo de divergência encontrada na reconciliação bancária
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ReconciliationDiscrepancyType
{
    /// <summary>Pagamento faltando no ledger</summary>
    PaymentNotInLedger,

    /// <summary>Saque faltando no ledger</summary>
    PayoutNotInLedger,

    /// <summary>Estorno faltando no ledger</summary>
    RefundNotInLedger,

    /// <summary>Reversão de saque faltando no ledger</summary>
    MissingReversal,

    /// <summary>Transação no ledger sem referência correspondente</summary>
    OrphanLedgerEntry,

    /// <summary>Valor diferente entre transação e ledger</summary>
    AmountMismatch,

    /// <summary>Taxa diferente entre transação e ledger</summary>
    FeeMismatch,

    /// <summary>Transação duplicada no ledger</summary>
    DuplicateLedgerEntry,

    /// <summary>Diferença inexplicada entre saldo do ledger e saldo calculado</summary>
    BalanceMismatch,

    /// <summary>Conta MerchantPayoutsOut não existe ou tem saldo incorreto</summary>
    PayoutsOutMismatch,

    /// <summary>Conta MerchantPending não existe ou tem saldo incorreto</summary>
    PendingMismatch,

    /// <summary>Conta MerchantBlocked não existe ou tem saldo incorreto</summary>
    BlockedMismatch,

    /// <summary>Conta MerchantAvailable negativa (saídas maiores que saldo suportado)</summary>
    NegativeAvailableBalance,

    /// <summary>Volume de saques acima do volume líquido de entrada disponível</summary>
    WithdrawalExceedsInflow
}

/// <summary>
/// Severidade da divergência encontrada na reconciliação
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ReconciliationDiscrepancySeverity
{
    /// <summary>Informativo apenas</summary>
    Info = 0,

    /// <summary>Atenção necessária</summary>
    Warning = 1,

    /// <summary>Erro que afeta o saldo</summary>
    Error = 2,

    /// <summary>Erro crítico que precisa de correção imediata</summary>
    Critical = 3
}

/// <summary>
/// Uma divergência específica encontrada durante a reconciliação bancária
/// </summary>
public class BankReconciliationDiscrepancy
{
    [Key]
    public Guid Id { get; set; }

    public Guid BankReconciliationId { get; set; }

    [ForeignKey(nameof(BankReconciliationId))]
    public BankReconciliation? BankReconciliation { get; set; }

    /// <summary>Tipo da divergência</summary>
    public ReconciliationDiscrepancyType Type { get; set; }

    /// <summary>Severidade da divergência</summary>
    public ReconciliationDiscrepancySeverity Severity { get; set; }

    /// <summary>Descrição legível da divergência</summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>Ação sugerida para correção</summary>
    public string? SuggestedAction { get; set; }

    /// <summary>ID do pagamento relacionado (se aplicável)</summary>
    public Guid? PaymentId { get; set; }

    [ForeignKey(nameof(PaymentId))]
    public Payment? Payment { get; set; }

    /// <summary>ID do payout relacionado (se aplicável)</summary>
    public Guid? PayoutId { get; set; }

    [ForeignKey(nameof(PayoutId))]
    public Payout? Payout { get; set; }

    /// <summary>ID da transação do ledger relacionada (se aplicável)</summary>
    public string? LedgerTransactionId { get; set; }

    [ForeignKey(nameof(LedgerTransactionId))]
    public LedgerTransaction? LedgerTransaction { get; set; }

    /// <summary>Valor esperado</summary>
    public long ExpectedAmount { get; set; }

    /// <summary>Valor encontrado</summary>
    public long ActualAmount { get; set; }

    /// <summary>Diferença de valor</summary>
    public long Difference { get; set; }

    /// <summary>Se esta divergência foi corrigida</summary>
    public bool Corrected { get; set; }

    /// <summary>Data em que foi corrigida</summary>
    public DateTime? CorrectedAt { get; set; }

    /// <summary>Descrição da correção aplicada</summary>
    public string? CorrectionDescription { get; set; }

    public DateTime CreatedAt { get; set; }
}
