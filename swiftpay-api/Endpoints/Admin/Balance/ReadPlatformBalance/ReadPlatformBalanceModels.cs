using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Admin.Balance.ReadPlatformBalance;

public sealed class ReadPlatformBalanceResponse : BaseResponse<AdminPlatformBalanceData>;

public sealed class AdminPlatformBalanceData
{
    // Saldos da plataforma
    public long PlatformBlocked { get; set; }
    public long PlatformPayoutsOut { get; set; }
    public long TotalPlatformOperationalBalance { get; set; }

    // Saldos dos merchants
    public long TotalMerchantAvailable { get; set; }
    public long TotalMerchantBlocked { get; set; }
    public long TotalMerchantBalance { get; set; }

    // Consolidados do ambiente
    public long TotalAcquirerGrossBalance { get; set; }
    public long TotalSafefyProfit { get; set; }
    public long ConsistencyDifference { get; set; }
    public long ConsistencyDifferenceAbsolute { get; set; }
    public bool IsConsistent { get; set; }

    // Taxas totais cobradas (soma de PlatformFee de pagamentos completed)
    public long TotalPlatformFees { get; set; }

    // Se sacar tudo de cada adquirente, quanto paga de taxa
    public long TotalWithdrawalFeeIfWithdrawAll { get; set; }

    // Soma do saldo da plataforma por adquirente: (AcquirerSettlement - AcquirerPayoutsOut) - MerchantAvailable
    public long TotalAvailableForWithdrawal { get; set; }

    // Líquido se sacar tudo (TotalAvailableForWithdrawal - TotalWithdrawalFeeIfWithdrawAll)
    public long NetIfWithdrawAll { get; set; }

    // Saldos por adquirente
    public IEnumerable<AdminAcquirerBalanceData> AcquirerBalances { get; set; } = [];
}

public sealed class AdminAcquirerBalanceData
{
    public Guid AcquirerId { get; set; }
    public string AcquirerName { get; set; } = null!;
    public string? AcquirerDisplayName { get; set; }
    public string AcquirerCode { get; set; } = null!;
    public string? AcquirerLogoUrl { get; set; }

    // Fluxo financeiro
    /// <summary>
    /// Total que entrou na adquirente (soma de Amount de pagamentos confirmados)
    /// </summary>
    public long TotalIn { get; set; }

    /// <summary>
    /// Total que saiu da adquirente (saques para merchants + saques da plataforma)
    /// </summary>
    public long TotalOut { get; set; }

    /// <summary>
    /// Saldo físico na adquirente (TotalIn - TotalOut) = dinheiro da Safefy + merchants
    /// </summary>
    public long GrossBalance { get; set; }

    /// <summary>
    /// Parcela do saldo da adquirente que pertence às organizações.
    /// </summary>
    public long MerchantBalance { get; set; }

    /// <summary>
    /// Soma real do bucket MerchantAvailable das organizações vinculadas a esta adquirente.
    /// </summary>
    public long MerchantAvailableBalance { get; set; }

    // Lucro da Safefy
    /// <summary>
    /// Lucro da Safefy nesta adquirente: (PlatformFee - AcquirerFee) de pagamentos + saques
    /// </summary>
    public long SafefyProfit { get; set; }

    /// <summary>
    /// Total de taxas pagas para esta adquirente (soma de AcquirerFee de todos os pagamentos)
    /// </summary>
    public long TotalAcquirerFees { get; set; }

    // Taxas de saque desta adquirente
    public FeeChargeMode PayoutFeeMode { get; set; }
    public long PayoutFeeFixed { get; set; }
    public int PayoutFeePercentage { get; set; }

    /// <summary>
    /// Taxa estimada se a plataforma sacar todo o saldo da plataforma desta adquirente
    /// </summary>
    public long WithdrawalFeeIfWithdrawAll { get; set; }

    /// <summary>
    /// Saldo da plataforma nesta adquirente: (AcquirerSettlement - AcquirerPayoutsOut) - MerchantAvailable.
    /// </summary>
    public long AvailableForWithdrawal { get; set; }

    /// <summary>
    /// Saldo líquido final se sacar tudo (AvailableForWithdrawal - WithdrawalFee)
    /// </summary>
    public long NetIfWithdrawAll { get; set; }

    /// <summary>
    /// Valor de saques da plataforma em processamento nesta adquirente
    /// </summary>
    public long PlatformPayoutsProcessing { get; set; }
}
