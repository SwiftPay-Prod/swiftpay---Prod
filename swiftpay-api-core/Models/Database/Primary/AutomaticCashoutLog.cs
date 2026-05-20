using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using safefy_api_core.Models.Enum;

namespace safefy_api_core.Models.Database;

public class AutomaticCashoutLog : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    /// <summary>
    /// Null quando o saque é da plataforma (fees).
    /// </summary>
    public Guid? MerchantId { get; set; }

    /// <summary>
    /// Ambiente em que o saque foi tentado.
    /// </summary>
    public ApiEnvironment Environment { get; set; } = ApiEnvironment.Production;

    /// <summary>
    /// Valor tentado em centavos (0 quando skipped por saldo insuficiente).
    /// </summary>
    public long AmountAttempted { get; set; }

    /// <summary>
    /// Valor líquido efetivamente sacado (após taxas). 0 quando não houve saque.
    /// </summary>
    public long NetAmount { get; set; }

    /// <summary>
    /// Status da tentativa.
    /// </summary>
    public AutomaticCashoutStatus Status { get; set; }

    /// <summary>
    /// Mensagem amigável para o usuário final.
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Detalhes técnicos (stack trace, error code) — não expor ao merchant.
    /// </summary>
    public string? TechnicalDetails { get; set; }

    /// <summary>
    /// Id do Payout criado (quando Success).
    /// </summary>
    public Guid? PayoutId { get; set; }

    // Relationships
    public Merchant? Merchant { get; set; }
    public Payout? Payout { get; set; }
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum AutomaticCashoutStatus
{
    Success,
    Failed,
    Skipped,
    Simulated
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum AutomaticCashoutFrequency
{
    Minutely,
    Hourly,
    Daily,
    Weekly
}
