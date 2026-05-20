using safefy_api_core.Models.Database;
using safefy_api_core.Models.Ledger;

namespace safefy_api_core.Interfaces;

public interface ILedgerService
{
    /// <summary>
    /// Registra um pagamento pendente (aguardando confirmação).
    /// Move o valor para MerchantPending.
    /// </summary>
    Task<LedgerTransactionResult> RecordPaymentPendingAsync(
        Guid merchantId,
        Guid merchantAcquirerId,
        Guid paymentId,
        long amount,
        long fee,
        string description,
        long? merchantSettlementAmount = null);

    /// <summary>
    /// Registra um pagamento confirmado.
    /// Move o valor de MerchantPending para MerchantAvailable e MerchantReserved.
    /// Registra taxas da plataforma e da adquirente.
    /// </summary>
    /// <param name="merchantId">Identificador do merchant dono do pagamento.</param>
    /// <param name="merchantAcquirerId">Identificador do vínculo ativo do merchant com a adquirente na origem do pagamento.</param>
    /// <param name="paymentId">Identificador do pagamento.</param>
    /// <param name="acquirerId">Identificador da adquirente (quando aplicável).</param>
    /// <param name="amount">Valor bruto do pagamento em centavos.</param>
    /// <param name="platformFee">Taxa da plataforma em centavos.</param>
    /// <param name="acquirerFee">Taxa da adquirente em centavos.</param>
    /// <param name="merchantSettlementAmount">Valor liquidado para o merchant (com reserva aplicada), quando informado.</param>
    /// <param name="description">Descrição operacional para auditoria no ledger.</param>
    /// <param name="feeSplitHandling">Define como a taxa da plataforma é tratada (split automático ou não)</param>
    /// <param name="platformOnly">Quando true, contabiliza somente para a plataforma sem liquidar saldo do merchant.</param>
    Task<LedgerTransactionResult> RecordPaymentReceivedAsync(
        Guid merchantId,
        Guid merchantAcquirerId,
        Guid paymentId,
        Guid? acquirerId,
        long amount,
        long platformFee,
        long acquirerFee,
        long? merchantSettlementAmount,
        string description,
        PaymentFeeSplitHandling feeSplitHandling = PaymentFeeSplitHandling.None,
        bool platformOnly = false);

    /// <summary>
    /// Registra o cancelamento de um pagamento pendente (expirado ou falhou).
    /// Remove o valor de MerchantPending.
    /// </summary>
    Task<LedgerTransactionResult> RecordPaymentCancelledAsync(
        Guid merchantId,
        Guid merchantAcquirerId,
        Guid paymentId,
        long amount,
        long fee,
        string description,
        long? merchantSettlementAmount = null);

    /// <summary>
    /// Registra um estorno de pagamento.
    /// Debita do MerchantAvailable e AcquirerSettlement.
    /// Reverte LifetimeVolume, VolumeToday/Week/Month e LifetimeFeesPaid.
    /// </summary>
    Task<LedgerTransactionResult> RecordPaymentRefundedAsync(
        Guid merchantId,
        Guid merchantAcquirerId,
        Guid paymentId,
        Guid? acquirerId,
        long amount,
        long platformFee,
        long acquirerFee,
        long? merchantSettlementAmount,
        string description,
        PaymentFeeSplitHandling feeSplitHandling = PaymentFeeSplitHandling.None);

    /// <summary>
    /// Registra um estorno parcial de pagamento.
    /// Debita proporcionalmente do MerchantAvailable baseado no valor reembolsado.
    /// Não reverte taxas (pois elas já foram cobradas sobre o valor total).
    /// </summary>
    Task<LedgerTransactionResult> RecordPaymentPartiallyRefundedAsync(
        Guid merchantId,
        Guid merchantAcquirerId,
        Guid paymentId,
        Guid? acquirerId,
        long originalAmount,
        long refundedAmount,
        long platformFee,
        long acquirerFee,
        long? merchantSettlementAmount,
        string description,
        PaymentFeeSplitHandling feeSplitHandling = PaymentFeeSplitHandling.None);

    Task<LedgerTransactionResult> RecordWithdrawalRequestedAsync(
        Guid merchantId,
        Guid payoutId,
        Guid merchantAcquirerId,
        long amount,
        long fee,
        string description);

    Task<LedgerTransactionResult> RecordWithdrawalCompletedAsync(
        Guid merchantId,
        Guid payoutId,
        Guid merchantAcquirerId,
        Guid acquirerId,
        long amount,
        long platformFee,
        long acquirerFee,
        string description);

    Task<LedgerTransactionResult> RecordWithdrawalFailedAsync(
        Guid merchantId,
        Guid payoutId,
        Guid merchantAcquirerId,
        long amount,
        long fee,
        string description);

    /// <summary>
    /// Registra a solicitação de saque da plataforma.
    /// Reserva o saque da plataforma em PlatformBlocked.
    /// </summary>
    Task<LedgerTransactionResult> RecordPlatformWithdrawalRequestedAsync(
        Guid platformPayoutId,
        long amount,
        string description);

    /// <summary>
    /// Registra o saque concluído da plataforma.
    /// Move o valor de PlatformBlocked para PlatformPayoutsOut e AcquirerPayoutsOut.
    /// </summary>
    Task<LedgerTransactionResult> RecordPlatformWithdrawalCompletedAsync(
        Guid platformPayoutId,
        Guid? platformPayoutItemId,
        Guid acquirerId,
        long amount,
        long acquirerFee,
        string description);

    /// <summary>
    /// Registra a falha do saque da plataforma.
    /// Remove a reserva existente em PlatformBlocked.
    /// platformPayoutItemId é usado para deduplicação quando múltiplos itens falham.
    /// Se null, usar platformPayoutId (para rollback de payout inteiro).
    /// </summary>
    Task<LedgerTransactionResult> RecordPlatformWithdrawalFailedAsync(
        Guid platformPayoutId,
        Guid? platformPayoutItemId,
        long amount,
        string description);

    /// <summary>
    /// Registra um ajuste manual no saldo da adquirente (AcquirerSettlement).
    /// Usado para conciliação bancária quando o valor físico na adquirente difere do ledger.
    /// </summary>
    Task<LedgerTransactionResult> RecordAcquirerAdjustmentAsync(
        Guid acquirerId,
        long amount,
        bool isCredit,
        string reason);

    /// <summary>
    /// Registra ajuste de lucro Safefy na adquirente diretamente no settlement.
    /// Esse ajuste altera a disponibilidade derivada da plataforma para saque.
    /// </summary>
    Task<LedgerTransactionResult> RecordAcquirerSafefyProfitAdjustmentAsync(
        Guid acquirerId,
        long amount,
        bool isCredit,
        string reason);

    /// <summary>
    /// Registra um ajuste manual no saldo do merchant (MerchantAvailable).
    /// A disponibilidade da plataforma passa a ser recalculada de forma derivada pela composição da adquirente.
    /// </summary>
    Task<LedgerTransactionResult> RecordMerchantAdjustmentAsync(
        Guid merchantId,
        Models.Enum.ApiEnvironment environment,
        long amount,
        bool isCredit,
        string reason,
        Guid? merchantAcquirerId = null);

    /// <summary>
    /// Registra pagamento manual de comissão de indicação.
    /// Registra a saída diretamente em PlatformPayoutsOut.
    /// </summary>
    Task<LedgerTransactionResult> RecordReferralCommissionPayoutAsync(
        long amount,
        string description);

    Task<long> GetMerchantAvailableBalanceAsync(Guid merchantId);

    Task<long> GetMerchantAvailableBalanceAsync(Guid merchantId, Guid merchantAcquirerId);

    Task<long> GetMerchantWithdrawNowAvailableBalanceAsync(Guid merchantId);

    Task<List<MerchantAcquirerBucketBalance>> GetMerchantAcquirerBucketBalancesAsync(Guid merchantId);

    Task<long> GetMerchantPendingBalanceAsync(Guid merchantId);

    Task<long> GetMerchantBlockedBalanceAsync(Guid merchantId);

    Task<long> GetMerchantReservedBalanceAsync(Guid merchantId);

    Task<MerchantBalanceInfo> GetMerchantBalanceInfoAsync(Guid merchantId);
    
    Task<Dictionary<Guid, long>> GetMerchantsAvailableBalancesAsync(IEnumerable<Guid> merchantIds);

    Task<long> GetTotalAvailableForWithdrawalAsync();
    
    Task<long> GetPlatformBlockedBalanceAsync();
    
    Task<PlatformBalanceInfo> GetPlatformBalanceInfoAsync();
}
