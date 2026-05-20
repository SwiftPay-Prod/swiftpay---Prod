using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace safefy_api_core.Models.Database;

public class MerchantSettings : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }
    public Guid MerchantId { get; set; }

    // ==========================================
    // ADMIN SETTINGS (configured by admin only)
    // If null, uses PlatformSettings defaults
    // ==========================================
    
    // PIX Limits (null = use platform defaults)
    public long? PixMinTransactionAmount { get; set; }
    public long? PixMaxTransactionAmount { get; set; }
    public bool? PixEnabled { get; set; }

    // PIX API Fee - charged by platform on each PIX transaction via API (null = use platform defaults)
    public FeeChargeMode? PixApiFeeMode { get; set; }
    public long? PixApiFeeFixed { get; set; }
    public int? PixApiFeePercentage { get; set; }

    // PIX Checkout Fee - charged by platform on each PIX transaction via Checkout (null = use platform defaults)
    public FeeChargeMode? PixCheckoutFeeMode { get; set; }
    public long? PixCheckoutFeeFixed { get; set; }
    public int? PixCheckoutFeePercentage { get; set; }

    // PIX Payment Link Fee - charged by platform on each PIX transaction via Payment Link (null = use platform defaults)
    public FeeChargeMode? PixPaymentLinkFeeMode { get; set; }
    public long? PixPaymentLinkFeeFixed { get; set; }
    public int? PixPaymentLinkFeePercentage { get; set; }

    // Financial reserve over merchant net settlement (basis points, null = use platform defaults)
    public int? PixReservePercentage { get; set; }

    // Reserve compensation window in days (null = use platform defaults)
    public int? PixReserveCompensationDays { get; set; }

    // BOLETO Limits (null = use platform defaults)
    public long? BoletoMinTransactionAmount { get; set; }
    public long? BoletoMaxTransactionAmount { get; set; }
    public bool? BoletoEnabled { get; set; }
    public bool? CreditCardEnabled { get; set; }

    // BOLETO API Fee - charged by platform on each BOLETO transaction via API (null = use platform defaults)
    public FeeChargeMode? BoletoApiFeeMode { get; set; }
    public long? BoletoApiFeeFixed { get; set; }
    public int? BoletoApiFeePercentage { get; set; }

    // CREDIT CARD API Fee - charged by platform on each CREDIT CARD transaction via API (null = use platform defaults)
    public FeeChargeMode? CreditCardApiFeeMode { get; set; }
    public long? CreditCardApiFeeFixed { get; set; }
    public int? CreditCardApiFeePercentage { get; set; }
    public int? CreditCardApiInstallmentFeePercentage { get; set; }

    // BOLETO Checkout Fee - charged by platform on each BOLETO transaction via Checkout (null = use platform defaults)
    public FeeChargeMode? BoletoCheckoutFeeMode { get; set; }
    public long? BoletoCheckoutFeeFixed { get; set; }
    public int? BoletoCheckoutFeePercentage { get; set; }

    // CREDIT CARD Checkout Fee - charged by platform on each CREDIT CARD transaction via Checkout (null = use platform defaults)
    public FeeChargeMode? CreditCardCheckoutFeeMode { get; set; }
    public long? CreditCardCheckoutFeeFixed { get; set; }
    public int? CreditCardCheckoutFeePercentage { get; set; }
    public int? CreditCardCheckoutInstallmentFeePercentage { get; set; }

    // BOLETO Payment Link Fee - charged by platform on each BOLETO transaction via Payment Link (null = use platform defaults)
    public FeeChargeMode? BoletoPaymentLinkFeeMode { get; set; }
    public long? BoletoPaymentLinkFeeFixed { get; set; }
    public int? BoletoPaymentLinkFeePercentage { get; set; }

    // CREDIT CARD Payment Link Fee - charged by platform on each CREDIT CARD transaction via Payment Link (null = use platform defaults)
    public FeeChargeMode? CreditCardPaymentLinkFeeMode { get; set; }
    public long? CreditCardPaymentLinkFeeFixed { get; set; }
    public int? CreditCardPaymentLinkFeePercentage { get; set; }
    public int? CreditCardPaymentLinkInstallmentFeePercentage { get; set; }

    // Financial reserve over merchant net settlement (basis points, null = use platform defaults)
    public int? BoletoReservePercentage { get; set; }

    // Reserve compensation window in days (null = use platform defaults)
    public int? BoletoReserveCompensationDays { get; set; }

    // Financial reserve over merchant net settlement (basis points, null = use platform defaults)
    public int? CreditCardReservePercentage { get; set; }

    // Reserve compensation window in days (null = use platform defaults)
    public int? CreditCardReserveCompensationDays { get; set; }

    // Withdrawal Fee (null = use platform defaults)
    public FeeChargeMode? WithdrawalFeeMode { get; set; }
    public long? WithdrawalFeeFixed { get; set; }
    public int? WithdrawalFeePercentage { get; set; }
    public long? MinWithdrawalAmount { get; set; }
    public bool? WithdrawalEnabled { get; set; }
    
    /// <summary>
    /// Modo de aprovação de saques (null = use platform defaults)
    /// </summary>
    public WithdrawalApprovalMode? WithdrawalApprovalMode { get; set; }

    // Rate Limiting - Payment API (null = use platform defaults)
    public int? RateLimitPerMinute { get; set; }
    public int? RateLimitPerHour { get; set; }
    public int? RateLimitPerDay { get; set; }

    /// <summary>
    /// JSON with selected payment link domain option IDs by method.
    /// </summary>
    public string? PaymentLinkDomainSelectionJson { get; set; }

    // ==========================================
    // AUTOMATIC CASHOUT (configured by merchant)
    // ==========================================

    /// <summary>
    /// Whether automatic cashout is enabled for this merchant.
    /// </summary>
    public bool IsAutomaticCashoutEnabled { get; set; } = false;

    /// <summary>
    /// Frequency of automatic cashout execution.
    /// </summary>
    public AutomaticCashoutFrequency AutomaticCashoutFrequency { get; set; } = AutomaticCashoutFrequency.Daily;

    /// <summary>
    /// Minimum balance (in cents) required to trigger automatic cashout.
    /// Null = use platform default.
    /// </summary>
    public long? AutomaticCashoutMinAmount { get; set; }

    /// <summary>
    /// Maximum amount (in cents) allowed per automatic cashout.
    /// Null = no maximum limit.
    /// </summary>
    public long? AutomaticCashoutMaxAmount { get; set; }

    /// <summary>
    /// Selected payout account destination for automatic cashout.
    /// Null = use active default payout account.
    /// </summary>
    public Guid? AutomaticCashoutPayoutAccountId { get; set; }

    /// <summary>
    /// Whether automatic cashout is enabled for this merchant in Sandbox environment.
    /// </summary>
    public bool IsAutomaticCashoutEnabledSandbox { get; set; } = false;

    /// <summary>
    /// Frequency of automatic cashout execution in Sandbox environment.
    /// </summary>
    public AutomaticCashoutFrequency AutomaticCashoutFrequencySandbox { get; set; } = AutomaticCashoutFrequency.Daily;

    /// <summary>
    /// Minimum balance (in cents) required to trigger automatic cashout in Sandbox environment.
    /// Null = use platform default.
    /// </summary>
    public long? AutomaticCashoutMinAmountSandbox { get; set; }

    /// <summary>
    /// Maximum amount (in cents) allowed per automatic cashout in Sandbox environment.
    /// Null = no maximum limit.
    /// </summary>
    public long? AutomaticCashoutMaxAmountSandbox { get; set; }

    /// <summary>
    /// Selected payout account destination for automatic cashout in Sandbox environment.
    /// Null = use active default payout account.
    /// </summary>
    public Guid? AutomaticCashoutPayoutAccountIdSandbox { get; set; }

    // Relationships
    public Merchant Merchant { get; set; } = null!;
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum FeeChargeMode
{
    FixedOnly,
    PercentageOnly,
    FixedAndPercentage
}

/// <summary>
/// Modo de aprovação de saques do merchant
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum WithdrawalApprovalMode
{
    /// <summary>
    /// Saques são aprovados automaticamente e processados imediatamente
    /// </summary>
    Automatic,
    
    /// <summary>
    /// Saques requerem aprovação manual do administrador
    /// </summary>
    Manual
}

/// <summary>
/// Define como a adquirente trata a taxa de saque (payout/withdrawal)
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum PayoutFeeHandling
{
    /// <summary>
    /// A taxa é deduzida do valor transferido.
    /// Ex: Envio R$ 100, taxa R$ 5, destinatário recebe R$ 95.
    /// Para garantir que o destinatário receba o valor correto, precisamos enviar valor + taxa.
    /// </summary>
    FeeDeductedFromTransfer,
    
    /// <summary>
    /// A taxa é adicionada ao débito da conta de origem.
    /// Ex: Envio R$ 100, taxa R$ 5, debitado R$ 105 da origem, destinatário recebe R$ 100.
    /// Enviamos o valor exato que o destinatário deve receber.
    /// </summary>
    FeeAddedToDebit
}

/// <summary>
/// Define como a adquirente trata o split da taxa da plataforma em pagamentos recebidos.
/// Algumas adquirentes fazem split automático enviando a taxa diretamente para a conta bancária da Safefy.
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum PaymentFeeSplitHandling
{
    /// <summary>
    /// Comportamento padrão: a taxa da plataforma não é dividida automaticamente.
    /// O valor passa a compor a disponibilidade derivada para saques futuros.
    /// </summary>
    None,
    
    /// <summary>
    /// A adquirente faz split automático e envia a taxa diretamente para a conta bancária da Safefy.
    /// O valor é creditado em PlatformPayoutsOut, pois já foi liquidado para a conta bancária da Safefy.
    /// Também registra em AcquirerPayoutsOut para conciliação.
    /// </summary>
    AutoSplitToBank
}
