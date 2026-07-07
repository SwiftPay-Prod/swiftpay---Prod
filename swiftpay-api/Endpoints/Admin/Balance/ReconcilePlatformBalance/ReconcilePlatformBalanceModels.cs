using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Admin.Balance.ReconcilePlatformBalance;

public sealed class ReconcilePlatformBalanceRequest
{
    public bool ApplyFix { get; set; } = false;
}

public sealed class ReconcilePlatformBalanceResponse : BaseResponse<PlatformReconciliationData>;

public sealed class PlatformReconciliationData
{
    public bool HasDiscrepancy { get; set; }
    public bool WasFixed { get; set; }
    public PlatformReconciliationSummary Summary { get; set; } = null!;
    public PlatformReconciliationAccount TotalAvailableForWithdrawal { get; set; } = null!;
    public PlatformReconciliationAccount Blocked { get; set; } = null!;
    public PlatformReconciliationAccount PayoutsOut { get; set; } = null!;
    public ReconciliationDetails Details { get; set; } = null!;
    public List<AcquirerReconciliationData> Acquirers { get; set; } = [];
}

public sealed class PlatformReconciliationSummary
{
    public long PlatformMismatchAmount { get; set; }
    public int CriticalAcquirersCount { get; set; }
    public int DiscrepantAcquirersCount { get; set; }
    public long CriticalOverdrawAmount { get; set; }
}

public sealed class AcquirerReconciliationData
{
    public Guid AcquirerId { get; set; }
    public string AcquirerName { get; set; } = string.Empty;
    public string? AcquirerDisplayName { get; set; }
    public string? AcquirerCode { get; set; }
    public string? AcquirerLogoUrl { get; set; }
    public bool HasDiscrepancy { get; set; }
    
    /// <summary>
    /// Volume bruto (soma de Amount) - deve bater com Volume Total do dashboard
    /// </summary>
    public long GrossVolume { get; set; }
    
    /// <summary>
    /// Total de taxas das adquirentes (soma de AcquirerFee)
    /// </summary>
    public long TotalAcquirerFees { get; set; }
    
    /// <summary>
    /// Entradas no ledger da adquirente (settlement).
    /// </summary>
    public PlatformReconciliationAccount In { get; set; } = null!;

    /// <summary>
    /// Saídas no ledger da adquirente (payouts out).
    /// </summary>
    public PlatformReconciliationAccount Out { get; set; } = null!;

    /// <summary>
    /// Saldo bruto físico da adquirente (In - Out).
    /// </summary>
    public PlatformReconciliationAccount GrossBalance { get; set; } = null!;

    /// <summary>
    /// Parcela do saldo bruto que pertence às organizações.
    /// </summary>
    public PlatformReconciliationAccount MerchantBalance { get; set; } = null!;

    /// <summary>
    /// Parcela do saldo bruto que pertence à Safefy.
    /// </summary>
    public PlatformReconciliationAccount SafefyProfit { get; set; } = null!;

    /// <summary>
    /// Excesso de saídas liquidadas acima do settlement corrente.
    /// </summary>
    public long OverdrawAmount { get; set; }

    /// <summary>
    /// Soma absoluta das divergências principais desta adquirente.
    /// </summary>
    public long TotalMismatch { get; set; }

    /// <summary>
    /// Legado: usa os mesmos valores de In para compatibilidade retroativa.
    /// </summary>
    public PlatformReconciliationAccount Settlement { get; set; } = null!;
    
    /// <summary>
    /// Legado: usa os mesmos valores de Out para compatibilidade retroativa.
    /// </summary>
    public PlatformReconciliationAccount PayoutsOut { get; set; } = null!;
}

public sealed class PlatformReconciliationAccount
{
    public long Expected { get; set; }
    public long Current { get; set; }
    public long Difference { get; set; }
}

public sealed class ReconciliationDetails
{
    public long TotalAvailableForWithdrawal { get; set; }
    public long TotalPlatformFeesFromPayments { get; set; }
    public long TotalAcquirerFeesFromPayments { get; set; }
    public long TotalProfitFeesFromPayments { get; set; }
    public long TotalPlatformFeesFromPayouts { get; set; }
    public long TotalAcquirerFeesFromPayouts { get; set; }
    public long TotalProfitFeesFromPayouts { get; set; }
    public long TotalAcquirerFeesFromPlatformPayouts { get; set; }
    public long TotalProcessingPayoutAmount { get; set; }
    public long TotalCompletedPayoutNetAmount { get; set; }
    public long TotalCompletedPayoutAmount { get; set; }
    public int CompletedPaymentsCount { get; set; }
    public int CompletedPayoutsCount { get; set; }
    public int ProcessingPayoutItemsCount { get; set; }
    public int CompletedPayoutItemsCount { get; set; }
    public long TotalAutoSplitProfit { get; set; }
    public long PartiallyRefundedRemainingProfit { get; set; }
}
