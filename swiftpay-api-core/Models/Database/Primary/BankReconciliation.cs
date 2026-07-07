using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Models.Database;

/// <summary>
/// Status da reconciliação bancária
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum BankReconciliationStatus
{
    /// <summary>Aguardando processamento</summary>
    Pending,

    /// <summary>Processamento em andamento</summary>
    Processing,

    /// <summary>Processamento concluído sem divergências</summary>
    Completed,

    /// <summary>Processamento concluído com divergências encontradas</summary>
    CompletedWithDiscrepancies,

    /// <summary>Correções aplicadas</summary>
    CorrectionsApplied,

    /// <summary>Falha no processamento</summary>
    Failed
}

/// <summary>
/// Resultado de uma reconciliação bancária para uma organização
/// </summary>
public class BankReconciliation
{
    [Key]
    public Guid Id { get; set; }

    /// <summary>Organização que está sendo reconciliada</summary>
    public Guid MerchantId { get; set; }

    [ForeignKey(nameof(MerchantId))]
    public Merchant? Merchant { get; set; }

    /// <summary>Ambiente da reconciliação</summary>
    public ApiEnvironment Environment { get; set; }

    /// <summary>Admin que solicitou a reconciliação</summary>
    public Guid RequestedByUserId { get; set; }

    [ForeignKey(nameof(RequestedByUserId))]
    public User? RequestedByUser { get; set; }

    /// <summary>Status da reconciliação</summary>
    public BankReconciliationStatus Status { get; set; }

    /// <summary>Mensagem de erro se Failed</summary>
    public string? ErrorMessage { get; set; }

    // ========== Valores calculados ==========

    /// <summary>Saldo atual no sistema (soma de transações no ledger)</summary>
    public long LedgerBalance { get; set; }

    /// <summary>Saldo atual no sistema (antes da reconciliação) - deprecated, use LedgerBalance</summary>
    public long CurrentBalance { get; set; }

    /// <summary>Saldo calculado pela reconciliação (soma de todas as transações)</summary>
    public long CalculatedBalance { get; set; }

    /// <summary>Diferença entre saldo atual e calculado (positivo = saldo a mais, negativo = saldo a menos)</summary>
    public long BalanceDifference { get; set; }

    /// <summary>Total de pagamentos confirmados no período</summary>
    public long TotalPaymentsAmount { get; set; }

    /// <summary>Quantidade de pagamentos confirmados</summary>
    public int TotalPaymentsCount { get; set; }

    /// <summary>Total de taxas cobradas</summary>
    public long TotalFeesAmount { get; set; }

    /// <summary>Total de saques processados</summary>
    public long TotalPayoutsAmount { get; set; }

    /// <summary>Quantidade de saques processados</summary>
    public int TotalPayoutsCount { get; set; }

    /// <summary>Total de estornos</summary>
    public long TotalRefundsAmount { get; set; }

    /// <summary>Quantidade de estornos</summary>
    public int TotalRefundsCount { get; set; }

    /// <summary>Total de ajustes manuais</summary>
    public long TotalAdjustmentsAmount { get; set; }

    /// <summary>Quantidade de ajustes manuais</summary>
    public int TotalAdjustmentsCount { get; set; }

    /// <summary>Total de transações no ledger</summary>
    public int TotalLedgerTransactionsCount { get; set; }

    // ========== Divergências ==========

    /// <summary>Se há divergências encontradas</summary>
    public bool HasDiscrepancies { get; set; }

    /// <summary>Quantidade total de divergências encontradas</summary>
    public int TotalDiscrepancies { get; set; }

    /// <summary>Quantidade de divergências encontradas - alias</summary>
    public int DiscrepanciesCount { get; set; }

    /// <summary>Valor total das divergências</summary>
    public long DiscrepanciesTotalAmount { get; set; }

    /// <summary>Valor total de divergências com erro (que afetam o saldo)</summary>
    public long DiscrepanciesWithErrorAmount { get; set; }

    /// <summary>Lista de divergências encontradas</summary>
    public List<BankReconciliationDiscrepancy> Discrepancies { get; set; } = [];

    // ========== Correção ==========

    /// <summary>Se as correções foram aplicadas</summary>
    public bool CorrectionsApplied { get; set; }

    /// <summary>Data em que as correções foram aplicadas</summary>
    public DateTime? CorrectionsAppliedAt { get; set; }

    /// <summary>Admin que aplicou as correções</summary>
    public Guid? CorrectionsAppliedByUserId { get; set; }

    [ForeignKey(nameof(CorrectionsAppliedByUserId))]
    public User? CorrectionsAppliedByUser { get; set; }

    /// <summary>Notas sobre as correções aplicadas</summary>
    public string? CorrectionNotes { get; set; }

    // ========== Modo Silencioso ==========

    /// <summary>Se a reconciliação foi executada em modo silencioso (sem notificações e sem registro visível para o merchant)</summary>
    public bool SilentMode { get; set; }

    // ========== Batch ==========

    /// <summary>ID do lote quando iniciado via start-all</summary>
    public Guid? BatchId { get; set; }

    // ========== Timestamps ==========

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? ProcessingStartedAt { get; set; }
    public DateTime? ProcessingCompletedAt { get; set; }
}
