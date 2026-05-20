using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api_core.Interfaces;

/// <summary>
/// Resultado da reconciliação bancária
/// </summary>
public class ReconciliationResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public BankReconciliation? Reconciliation { get; set; }
}

/// <summary>
/// Item individual do resultado de reconciliação em massa
/// </summary>
public sealed class StartAllReconciliationItem
{
    public Guid MerchantId { get; set; }
    public string? MerchantName { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? ErrorMessage { get; set; }
    public Guid? ReconciliationId { get; set; }
}

/// <summary>
/// Resultado da operação de reconciliação em massa
/// </summary>
public sealed class StartAllReconciliationsResult
{
    public int TotalMerchants { get; set; }
    public int Queued { get; set; }
    public int Skipped { get; set; }
    public int Errors { get; set; }
    public List<StartAllReconciliationItem> Items { get; set; } = [];
}

/// <summary>
/// Interface para o serviço de reconciliação bancária
/// </summary>
public interface IBankReconciliationService
{
    /// <summary>
    /// Inicia uma nova reconciliação bancária para uma organização.
    /// O Environment é obtido do IEnvironmentProvider (header X-Environment).
    /// O processamento é feito em background via fila.
    /// </summary>
    /// <param name="merchantId">ID da organização</param>
    /// <param name="requestedByUserId">ID do admin que solicitou</param>
    /// <param name="silentMode">Se true, não envia notificações e não aparece no histórico do merchant</param>
    /// <param name="batchId">ID do lote para agrupamento de reconciliações em massa</param>
    Task<BankReconciliation> StartReconciliationAsync(
        Guid merchantId,
        Guid requestedByUserId,
        bool silentMode = false,
        Guid? batchId = null);

    /// <summary>
    /// Processa a reconciliação bancária (chamado pelo consumer).
    /// O Consumer deve configurar o Environment via HybridEnvironmentProvider.SetEnvironment() antes de chamar.
    /// Verifica todas as transações do ledger contra os pagamentos e saques.
    /// </summary>
    Task<ReconciliationResult> ProcessReconciliationAsync(Guid reconciliationId);

    /// <summary>
    /// Aplica as correções encontradas na reconciliação.
    /// Cria transações de ajuste no ledger para corrigir o saldo.
    /// </summary>
    Task<ReconciliationResult> ApplyCorrectionsAsync(
        Guid reconciliationId,
        Guid appliedByUserId,
        string? notes);

    /// <summary>
    /// Obtém uma reconciliação pelo ID
    /// </summary>
    Task<BankReconciliation?> GetReconciliationAsync(Guid reconciliationId);

    /// <summary>
    /// Lista reconciliações de uma organização.
    /// O Environment é obtido do IEnvironmentProvider (header X-Environment).
    /// </summary>
    Task<List<BankReconciliation>> ListReconciliationsAsync(
        Guid merchantId,
        int page = 1,
        int pageSize = 10);

    /// <summary>
    /// Conta total de reconciliações de uma organização.
    /// O Environment é obtido do IEnvironmentProvider (header X-Environment).
    /// </summary>
    Task<int> CountReconciliationsAsync(Guid merchantId);

    /// <summary>
    /// Inicia reconciliação bancária para todas as organizações ativas que processaram
    /// na plataforma no ambiente atual (obtido do IEnvironmentProvider).
    /// Organizações com reconciliação já em andamento são ignoradas.
    /// </summary>
    /// <param name="requestedByUserId">ID do admin que solicitou</param>
    /// <param name="silentMode">Se true, não envia notificações para as organizações</param>
    /// <param name="ct">Cancellation token</param>
    Task<StartAllReconciliationsResult> StartReconciliationForAllMerchantsAsync(
        Guid requestedByUserId,
        bool silentMode = false,
        CancellationToken ct = default);
}
