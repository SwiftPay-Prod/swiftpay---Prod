using FastEndpoints;
using safefy_api_payment.Endpoints.Models;

namespace safefy_api_payment.Endpoints.Balance.Get;

/// <summary>
/// Response da consulta de saldo.
/// </summary>
public sealed class GetBalanceResponse : BaseResponse<BalanceData>;

/// <summary>
/// Dados do saldo da conta.
/// </summary>
public sealed class BalanceData
{
    /// <summary>
    /// Moeda (BRL).
    /// </summary>
    public string Currency { get; set; } = "BRL";

    /// <summary>
    /// Informações de saldo.
    /// </summary>
    public BalanceInfo Balance { get; set; } = null!;

    /// <summary>
    /// Totais históricos (lifetime).
    /// </summary>
    public TotalsInfo Totals { get; set; } = null!;

    /// <summary>
    /// Volumes por período.
    /// </summary>
    public PeriodInfo Period { get; set; } = null!;

    /// <summary>
    /// Data da última atualização.
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Informações de saldo da conta.
/// </summary>
public sealed class BalanceInfo
{
    /// <summary>
    /// Saldo disponível para saque agora em centavos (regra operacional de ciclo atual).
    /// </summary>
    public long Available { get; set; }

    /// <summary>
    /// Saldo disponível para saque imediato no ciclo atual em centavos.
    /// </summary>
    public long WithdrawNowAvailable { get; set; }

    /// <summary>
    /// Indica se o saque atual precisa ser exatamente o valor de WithdrawNowAvailable.
    /// </summary>
    public bool RequiresFullWithdrawalNow { get; set; }

    /// <summary>
    /// Saldo pendente (aguardando confirmação) em centavos.
    /// </summary>
    public long Pending { get; set; }

    /// <summary>
    /// Saldo reservado (saques em processamento) em centavos.
    /// </summary>
    public long Reserved { get; set; }

    /// <summary>
    /// Saldo total visível (available + pending + reserved) em centavos.
    /// </summary>
    public long Total { get; set; }
}

/// <summary>
/// Totais históricos do saldo.
/// </summary>
public sealed class TotalsInfo
{
    /// <summary>
    /// Volume total de pagamentos confirmados em centavos (lifetime).
    /// </summary>
    public long LifetimeVolume { get; set; }

    /// <summary>
    /// Total de saques realizados em centavos (lifetime).
    /// </summary>
    public long LifetimePayouts { get; set; }

    /// <summary>
    /// Total de estornos em centavos (lifetime).
    /// </summary>
    public long LifetimeRefunds { get; set; }
}

/// <summary>
/// Volumes por período. Apenas pagamentos com status completed são contabilizados.
/// </summary>
public sealed class PeriodInfo
{
    /// <summary>
    /// Volume de pagamentos confirmados hoje em centavos.
    /// </summary>
    public long VolumeToday { get; set; }

    /// <summary>
    /// Volume de pagamentos confirmados na semana atual em centavos.
    /// </summary>
    public long VolumeThisWeek { get; set; }

    /// <summary>
    /// Volume de pagamentos confirmados no mês atual em centavos.
    /// </summary>
    public long VolumeThisMonth { get; set; }
}
