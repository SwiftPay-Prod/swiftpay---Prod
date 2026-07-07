namespace swiftpay_api_core.Models.Ledger;

public class PlatformBalanceInfo
{
    public string Currency { get; set; } = "BRL";
    
    /// <summary>
    /// Saldo disponível (lucros que podem ser sacados)
    /// </summary>
    public long Available { get; set; }
    
    /// <summary>
    /// Saldo bloqueado (saques em processamento)
    /// </summary>
    public long Blocked { get; set; }
    
    /// <summary>
    /// Saldo total (Available + Blocked)
    /// </summary>
    public long Total { get; set; }
    
    /// <summary>
    /// Total de saques realizados (acumulativo)
    /// </summary>
    public long LifetimePayoutsOut { get; set; }
    
    public DateTime UpdatedAt { get; set; }
}
