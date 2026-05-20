using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace safefy_api_core.Models.Database;

/// <summary>
/// Platform-wide default settings.
/// These values are used as fallback when MerchantSettings doesn't have a specific value.
/// There should be only ONE record in this table (singleton pattern).
/// </summary>
public class PlatformSettings : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    // ==========================================
    // PIX LIMITS (defaults)
    // ==========================================

    /// <summary>
    /// Default minimum PIX transaction amount in cents
    /// </summary>
    public long PixMinTransactionAmount { get; set; } = 100; // R$ 1,00

    /// <summary>
    /// Default maximum PIX transaction amount in cents
    /// </summary>
    public long PixMaxTransactionAmount { get; set; } = 100000000; // R$ 1.000.000,00

    /// <summary>
    /// Default PIX timeout in minutes
    /// </summary>
    public int PixTimeoutMinutes { get; set; } = 30;

    /// <summary>
    /// Default PIX availability for merchants.
    /// </summary>
    public bool PixEnabled { get; set; } = true;

    // ==========================================
    // PIX API FEE (defaults)
    // ==========================================

    /// <summary>
    /// Default fee mode for PIX transactions via API
    /// </summary>
    public FeeChargeMode PixApiFeeMode { get; set; } = FeeChargeMode.PercentageOnly;

    /// <summary>
    /// Default fixed fee for PIX transactions via API (in cents)
    /// </summary>
    public long PixApiFeeFixed { get; set; } = 0;

    /// <summary>
    /// Default percentage fee for PIX transactions via API (in basis points: 150 = 1.5%)
    /// </summary>
    public int PixApiFeePercentage { get; set; } = 150; // 1.5%

    // ==========================================
    // PIX CHECKOUT FEE (defaults)
    // ==========================================

    /// <summary>
    /// Default fee mode for PIX transactions via Checkout
    /// </summary>
    public FeeChargeMode PixCheckoutFeeMode { get; set; } = FeeChargeMode.PercentageOnly;

    /// <summary>
    /// Default fixed fee for PIX transactions via Checkout (in cents)
    /// </summary>
    public long PixCheckoutFeeFixed { get; set; } = 0;

    /// <summary>
    /// Default percentage fee for PIX transactions via Checkout (in basis points: 200 = 2%)
    /// </summary>
    public int PixCheckoutFeePercentage { get; set; } = 200; // 2%

    // ==========================================
    // PIX PAYMENT LINK FEE (defaults)
    // ==========================================

    /// <summary>
    /// Default fee mode for PIX transactions via Payment Link
    /// </summary>
    public FeeChargeMode PixPaymentLinkFeeMode { get; set; } = FeeChargeMode.PercentageOnly;

    /// <summary>
    /// Default fixed fee for PIX transactions via Payment Link (in cents)
    /// </summary>
    public long PixPaymentLinkFeeFixed { get; set; } = 0;

    /// <summary>
    /// Default percentage fee for PIX transactions via Payment Link (in basis points: 200 = 2%)
    /// </summary>
    public int PixPaymentLinkFeePercentage { get; set; } = 200; // 2%

    /// <summary>
    /// Default financial reserve over merchant PIX net settlement (basis points).
    /// </summary>
    public int PixReservePercentage { get; set; } = 0;

    /// <summary>
    /// Default reserve compensation window for PIX (days).
    /// Value 0 means immediate release to available balance.
    /// </summary>
    public int PixReserveCompensationDays { get; set; } = 0;

    // ==========================================
    // BOLETO LIMITS (defaults)
    // ==========================================

    /// <summary>
    /// Default minimum BOLETO transaction amount in cents
    /// </summary>
    public long BoletoMinTransactionAmount { get; set; } = 500; // R$ 5,00

    /// <summary>
    /// Default maximum BOLETO transaction amount in cents
    /// </summary>
    public long BoletoMaxTransactionAmount { get; set; } = 100000000; // R$ 1.000.000,00

    /// <summary>
    /// Default BOLETO availability for merchants.
    /// </summary>
    public bool BoletoEnabled { get; set; } = false;

    /// <summary>
    /// Default credit card availability for merchants.
    /// </summary>
    public bool CreditCardEnabled { get; set; } = false;

    // ==========================================
    // CREDIT CARD API FEE (defaults)
    // ==========================================

    /// <summary>
    /// Default fee mode for CREDIT CARD transactions via API
    /// </summary>
    public FeeChargeMode CreditCardApiFeeMode { get; set; } = FeeChargeMode.PercentageOnly;

    /// <summary>
    /// Default fixed fee for CREDIT CARD transactions via API (in cents)
    /// </summary>
    public long CreditCardApiFeeFixed { get; set; } = 0;

    /// <summary>
    /// Default percentage fee for CREDIT CARD transactions via API (in basis points: 250 = 2.5%)
    /// </summary>
    public int CreditCardApiFeePercentage { get; set; } = 250;

    /// <summary>
    /// Additional percentage fee per extra installment for CREDIT CARD via API (basis points).
    /// Applied for installments greater than 1.
    /// </summary>
    public int CreditCardApiInstallmentFeePercentage { get; set; } = 0;

    // ==========================================
    // CREDIT CARD CHECKOUT FEE (defaults)
    // ==========================================

    /// <summary>
    /// Default fee mode for CREDIT CARD transactions via Checkout
    /// </summary>
    public FeeChargeMode CreditCardCheckoutFeeMode { get; set; } = FeeChargeMode.PercentageOnly;

    /// <summary>
    /// Default fixed fee for CREDIT CARD transactions via Checkout (in cents)
    /// </summary>
    public long CreditCardCheckoutFeeFixed { get; set; } = 0;

    /// <summary>
    /// Default percentage fee for CREDIT CARD transactions via Checkout (in basis points: 300 = 3%)
    /// </summary>
    public int CreditCardCheckoutFeePercentage { get; set; } = 300;

    /// <summary>
    /// Additional percentage fee per extra installment for CREDIT CARD via Checkout (basis points).
    /// Applied for installments greater than 1.
    /// </summary>
    public int CreditCardCheckoutInstallmentFeePercentage { get; set; } = 0;

    // ==========================================
    // CREDIT CARD PAYMENT LINK FEE (defaults)
    // ==========================================

    /// <summary>
    /// Default fee mode for CREDIT CARD transactions via Payment Link
    /// </summary>
    public FeeChargeMode CreditCardPaymentLinkFeeMode { get; set; } = FeeChargeMode.PercentageOnly;

    /// <summary>
    /// Default fixed fee for CREDIT CARD transactions via Payment Link (in cents)
    /// </summary>
    public long CreditCardPaymentLinkFeeFixed { get; set; } = 0;

    /// <summary>
    /// Default percentage fee for CREDIT CARD transactions via Payment Link (in basis points: 300 = 3%)
    /// </summary>
    public int CreditCardPaymentLinkFeePercentage { get; set; } = 300;

    /// <summary>
    /// Additional percentage fee per extra installment for CREDIT CARD via Payment Link (basis points).
    /// Applied for installments greater than 1.
    /// </summary>
    public int CreditCardPaymentLinkInstallmentFeePercentage { get; set; } = 0;

    // ==========================================
    // BOLETO API FEE (defaults)
    // ==========================================

    /// <summary>
    /// Default fee mode for BOLETO transactions via API
    /// </summary>
    public FeeChargeMode BoletoApiFeeMode { get; set; } = FeeChargeMode.PercentageOnly;

    /// <summary>
    /// Default fixed fee for BOLETO transactions via API (in cents)
    /// </summary>
    public long BoletoApiFeeFixed { get; set; } = 0;

    /// <summary>
    /// Default percentage fee for BOLETO transactions via API (in basis points: 150 = 1.5%)
    /// </summary>
    public int BoletoApiFeePercentage { get; set; } = 150; // 1.5%

    // ==========================================
    // BOLETO CHECKOUT FEE (defaults)
    // ==========================================

    /// <summary>
    /// Default fee mode for BOLETO transactions via Checkout
    /// </summary>
    public FeeChargeMode BoletoCheckoutFeeMode { get; set; } = FeeChargeMode.PercentageOnly;

    /// <summary>
    /// Default fixed fee for BOLETO transactions via Checkout (in cents)
    /// </summary>
    public long BoletoCheckoutFeeFixed { get; set; } = 0;

    /// <summary>
    /// Default percentage fee for BOLETO transactions via Checkout (in basis points: 200 = 2%)
    /// </summary>
    public int BoletoCheckoutFeePercentage { get; set; } = 200; // 2%

    // ==========================================
    // BOLETO PAYMENT LINK FEE (defaults)
    // ==========================================

    /// <summary>
    /// Default fee mode for BOLETO transactions via Payment Link
    /// </summary>
    public FeeChargeMode BoletoPaymentLinkFeeMode { get; set; } = FeeChargeMode.PercentageOnly;

    /// <summary>
    /// Default fixed fee for BOLETO transactions via Payment Link (in cents)
    /// </summary>
    public long BoletoPaymentLinkFeeFixed { get; set; } = 0;

    /// <summary>
    /// Default percentage fee for BOLETO transactions via Payment Link (in basis points: 200 = 2%)
    /// </summary>
    public int BoletoPaymentLinkFeePercentage { get; set; } = 200; // 2%

    /// <summary>
    /// Base domain for PIX payment link URLs.
    /// </summary>
    public string PixPaymentLinkBaseUrl { get; set; } = string.Empty;

    /// <summary>
    /// Base domain for BOLETO payment link URLs.
    /// </summary>
    public string BoletoPaymentLinkBaseUrl { get; set; } = string.Empty;

    /// <summary>
    /// Base domain for CREDIT CARD payment link URLs.
    /// </summary>
    public string CreditCardPaymentLinkBaseUrl { get; set; } = string.Empty;

    /// <summary>
    /// JSON configuration with multiple payment link domains per method and optional branding.
    /// </summary>
    public string PaymentLinkDomainOptionsJson { get; set; } = string.Empty;

    /// <summary>
    /// Base domain for BOLETO proxy URLs.
    /// </summary>
    public string BoletoProxyBaseUrl { get; set; } = string.Empty;

    /// <summary>
    /// Default financial reserve over merchant BOLETO net settlement (basis points).
    /// </summary>
    public int BoletoReservePercentage { get; set; } = 0;

    /// <summary>
    /// Default reserve compensation window for BOLETO (days).
    /// Value 0 means immediate release to available balance.
    /// </summary>
    public int BoletoReserveCompensationDays { get; set; } = 0;

    /// <summary>
    /// Default financial reserve over merchant CREDIT CARD net settlement (basis points).
    /// </summary>
    public int CreditCardReservePercentage { get; set; } = 0;

    /// <summary>
    /// Default reserve compensation window for CREDIT CARD (days).
    /// Value 0 means immediate release to available balance.
    /// </summary>
    public int CreditCardReserveCompensationDays { get; set; } = 0;

    // ==========================================
    // WITHDRAWAL FEE (defaults)
    // ==========================================

    /// <summary>
    /// Default fee mode for withdrawals
    /// </summary>
    public FeeChargeMode WithdrawalFeeMode { get; set; } = FeeChargeMode.FixedOnly;

    /// <summary>
    /// Default fixed fee for withdrawals (in cents)
    /// </summary>
    public long WithdrawalFeeFixed { get; set; } = 200; // R$ 2,00

    /// <summary>
    /// Default percentage fee for withdrawals (in basis points)
    /// </summary>
    public int WithdrawalFeePercentage { get; set; } = 0;

    /// <summary>
    /// Default minimum withdrawal amount (in cents)
    /// </summary>
    public long MinWithdrawalAmount { get; set; } = 1000; // R$ 10,00

    /// <summary>
    /// Default withdrawal approval mode
    /// </summary>
    public WithdrawalApprovalMode WithdrawalApprovalMode { get; set; } = WithdrawalApprovalMode.Manual;

    /// <summary>
    /// Default withdrawal availability for merchants.
    /// </summary>
    public bool WithdrawalEnabled { get; set; } = true;

    /// <summary>
    /// When enabled, merchants can switch nominal by self-service.
    /// </summary>
    public bool SelfNominalSwitchEnabled { get; set; } = true;

    // ==========================================
    // RATE LIMITING (defaults)
    // ==========================================

    /// <summary>
    /// Default rate limit per minute for Payment API
    /// </summary>
    public int RateLimitPerMinute { get; set; } = 60;

    /// <summary>
    /// Default rate limit per hour for Payment API
    /// </summary>
    public int RateLimitPerHour { get; set; } = 1000;

    /// <summary>
    /// Default rate limit per day for Payment API
    /// </summary>
    public int RateLimitPerDay { get; set; } = 10000;

    // ==========================================
    // REFERRAL SETTINGS (defaults)
    // ==========================================

    /// <summary>
    /// Duração padrão em meses para elegibilidade da indicação
    /// </summary>
    public int ReferralDurationMonths { get; set; } = 12;

    /// <summary>
    /// Percentual padrão da comissão de indicação sobre o lucro da transação
    /// (em basis points: 1000 = 10%)
    /// </summary>
    public int ReferralCommissionPercentage { get; set; } = 1000;

    /// <summary>
    /// Intervalo padrão para novo saque de comissão (valor numérico).
    /// </summary>
    public int ReferralCommissionWithdrawalIntervalValue { get; set; } = 1;

    /// <summary>
    /// Unidade padrão do intervalo para novo saque de comissão.
    /// </summary>
    public ReferralWithdrawalIntervalUnit ReferralCommissionWithdrawalIntervalUnit { get; set; } = ReferralWithdrawalIntervalUnit.Days;

    /// <summary>
    /// Valor mínimo padrão para saque de comissão de indicação (em centavos).
    /// </summary>
    public long ReferralCommissionMinWithdrawalAmount { get; set; } = 1000;

    /// <summary>
    /// Taxa fixa padrão para saque de comissão de indicação (em centavos).
    /// </summary>
    public long ReferralCommissionWithdrawalFeeFixed { get; set; } = 0;

    // ==========================================
    // AUTOMATIC CASHOUT DEFAULTS
    // ==========================================

    /// <summary>
    /// Whether automatic platform cashout is enabled.
    /// </summary>
    public bool IsAutomaticCashoutEnabled { get; set; } = false;

    /// <summary>
    /// Frequency of automatic platform cashout execution.
    /// </summary>
    public AutomaticCashoutFrequency AutomaticCashoutFrequency { get; set; } = AutomaticCashoutFrequency.Daily;

    /// <summary>
    /// Minimum balance (in cents) required to trigger automatic cashout.
    /// </summary>
    public long AutomaticCashoutMinAmount { get; set; } = 1000; // R$ 10,00

    /// <summary>
    /// Maximum amount (in cents) allowed per automatic cashout.
    /// Null = no maximum limit.
    /// </summary>
    public long? AutomaticCashoutMaxAmount { get; set; }

    /// <summary>
    /// Selected payout account destination for platform automatic cashout.
    /// Null = use active default platform payout account.
    /// </summary>
    public Guid? AutomaticCashoutPayoutAccountId { get; set; }
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ReferralWithdrawalIntervalUnit
{
    Days,
    Months,
}
