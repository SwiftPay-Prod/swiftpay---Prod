using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace swiftpay_api_core.Models.Database;

public class MerchantAcquirer : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }
    public Guid MerchantId { get; set; }
    public Guid AcquirerId { get; set; }
    
    public bool IsActive { get; set; } = true;
    public bool IsDefault { get; set; } = false;
    public DateTime? ActivatedAt { get; set; }
    
    // Operações habilitadas para este merchant (sobrescreve Acquirer se definido)
    public bool? PixEnabled { get; set; }
    public bool? BoletoEnabled { get; set; }
    public bool? CreditCardEnabled { get; set; }
    
    // ==========================================
    // CREDENCIAIS GENÉRICAS (JSON)
    // ==========================================

    /// <summary>
    /// Credenciais do merchant em formato JSON.
    /// Ex: { "secretKey": "sk_merchant_...", "companyId": "MERCHANT_001" }
    /// </summary>
    public string? Credentials { get; set; }

    public string? AdditionalSettings { get; set; }
    
    // ==========================================
    // TAXAS DE PROCESSAMENTO PIX (PIX IN)
    // Sobrescreve as taxas padrão da adquirente para este merchant
    // ==========================================
    
    /// <summary>
    /// Modo de cobrança da taxa de PIX In (recebimento)
    /// </summary>
    public FeeChargeMode PixInFeeMode { get; set; } = FeeChargeMode.PercentageOnly;
    
    /// <summary>
    /// Taxa fixa de PIX In em centavos
    /// </summary>
    public long PixInFeeFixed { get; set; } = 0;
    
    /// <summary>
    /// Taxa percentual de PIX In em basis points (50 = 0.5%)
    /// </summary>
    public int PixInFeePercentage { get; set; } = 50;

    // ==========================================
    // TAXAS DE PROCESSAMENTO BOLETO (BOLETO IN)
    // Sobrescreve as taxas padrão da adquirente para este merchant
    // ==========================================

    /// <summary>
    /// Modo de cobrança da taxa de BOLETO In (recebimento)
    /// </summary>
    public FeeChargeMode BoletoInFeeMode { get; set; } = FeeChargeMode.PercentageOnly;

    /// <summary>
    /// Taxa fixa de BOLETO In em centavos
    /// </summary>
    public long BoletoInFeeFixed { get; set; } = 0;

    /// <summary>
    /// Taxa percentual de BOLETO In em basis points (50 = 0.5%)
    /// </summary>
    public int BoletoInFeePercentage { get; set; } = 50;

    // ==========================================
    // TAXAS DE PROCESSAMENTO CARTÃO DE CRÉDITO (CREDIT CARD IN)
    // Sobrescreve as taxas padrão da adquirente para este merchant
    // ==========================================

    /// <summary>
    /// Modo de cobrança da taxa de CARTÃO DE CRÉDITO In (recebimento)
    /// </summary>
    public FeeChargeMode CreditCardInFeeMode { get; set; } = FeeChargeMode.PercentageOnly;

    /// <summary>
    /// Taxa fixa de CARTÃO DE CRÉDITO In em centavos
    /// </summary>
    public long CreditCardInFeeFixed { get; set; } = 0;

    /// <summary>
    /// Taxa percentual de CARTÃO DE CRÉDITO In em basis points (250 = 2.5%)
    /// </summary>
    public int CreditCardInFeePercentage { get; set; } = 250;

    // ==========================================
    // TAXAS DE SAQUE (PIX OUT / PAYOUT)
    // Sobrescreve as taxas padrão da adquirente para este merchant
    // ==========================================
    
    /// <summary>
    /// Modo de cobrança da taxa de saque
    /// </summary>
    public FeeChargeMode PayoutFeeMode { get; set; } = FeeChargeMode.FixedOnly;
    
    /// <summary>
    /// Taxa fixa de saque em centavos
    /// </summary>
    public long PayoutFeeFixed { get; set; } = 100;
    
    /// <summary>
    /// Taxa percentual de saque em basis points
    /// </summary>
    public int PayoutFeePercentage { get; set; } = 0;

    // ==========================================
    // SPLIT AUTOMÁTICO DE TAXAS (FEE SPLIT)
    // Sobrescreve as configurações padrão da adquirente para este merchant
    // ==========================================

    /// <summary>
    /// Define como a adquirente trata o split da taxa da plataforma em PIX.
    /// None: comportamento padrão, taxa compõe a disponibilidade derivada para saque.
    /// AutoSplitToBank: adquirente envia taxa direto para conta bancária da SwiftPay.
    /// </summary>
    public PaymentFeeSplitHandling PixFeeSplitHandling { get; set; } = PaymentFeeSplitHandling.None;

    /// <summary>
    /// Define como a adquirente trata o split da taxa da plataforma em Boleto.
    /// None: comportamento padrão, taxa compõe a disponibilidade derivada para saque.
    /// AutoSplitToBank: adquirente envia taxa direto para conta bancária da SwiftPay.
    /// </summary>
    public PaymentFeeSplitHandling BoletoFeeSplitHandling { get; set; } = PaymentFeeSplitHandling.None;

    /// <summary>
    /// Define como a adquirente trata o split da taxa da plataforma em Cartão de Crédito.
    /// None: comportamento padrão, taxa compõe a disponibilidade derivada para saque.
    /// AutoSplitToBank: adquirente envia taxa direto para conta bancária da SwiftPay.
    /// </summary>
    public PaymentFeeSplitHandling CreditCardFeeSplitHandling { get; set; } = PaymentFeeSplitHandling.None;

    // ==========================================
    // SUBMERCHANT (IP - Instituição de Pagamento)
    // ==========================================

    /// <summary>
    /// ID do submerchant na IP externa (ex: Accithus submerchant ID)
    /// </summary>
    public string? ExternalSubmerchantId { get; set; }

    /// <summary>
    /// Status do onboarding do submerchant na IP externa
    /// </summary>
    public ExternalSubmerchantStatus ExternalSubmerchantStatus { get; set; } = ExternalSubmerchantStatus.NotSubmitted;

    /// <summary>
    /// Data de submissão do KYC para a IP externa
    /// </summary>
    public DateTime? ExternalOnboardingSubmittedAt { get; set; }

    /// <summary>
    /// Data de conclusão do onboarding na IP externa (aprovação ou rejeição)
    /// </summary>
    public DateTime? ExternalOnboardingCompletedAt { get; set; }

    /// <summary>
    /// Motivo da rejeição do onboarding na IP externa
    /// </summary>
    public string? ExternalOnboardingRejectionReason { get; set; }

    // ==========================================
    // TAXAS DE ANTECIPAÇÃO (IP)
    // ==========================================

    /// <summary>
    /// Modo de cobrança da taxa de antecipação (quando aplicável em IPs)
    /// </summary>
    public FeeChargeMode? AnticipationFeeMode { get; set; }

    /// <summary>
    /// Taxa fixa de antecipação em centavos
    /// </summary>
    public long AnticipationFeeFixed { get; set; } = 0;

    /// <summary>
    /// Taxa percentual de antecipação em basis points
    /// </summary>
    public int AnticipationFeePercentage { get; set; } = 0;

    // Relationships
    public Merchant Merchant { get; set; } = null!;
    public Acquirer Acquirer { get; set; } = null!;
    public ICollection<Account> Accounts { get; set; } = [];
    
    // ==========================================
    // MÉTODOS AUXILIARES PARA OPERAÇÕES HABILITADAS
    // ==========================================
    
    /// <summary>
    /// Verifica se PIX está habilitado para este merchant
    /// Considera: Acquirer.SupportsPix AND (MerchantAcquirer.PixEnabled ?? Acquirer.PixEnabled)
    /// </summary>
    public bool IsPixEnabled() => Acquirer?.SupportsPix == true && (PixEnabled ?? Acquirer?.PixEnabled ?? false);
    
    /// <summary>
    /// Verifica se Boleto está habilitado para este merchant
    /// Considera: Acquirer.SupportsBoleto AND (MerchantAcquirer.BoletoEnabled ?? Acquirer.BoletoEnabled)
    /// </summary>
    public bool IsBoletoEnabled() => Acquirer?.SupportsBoleto == true && (BoletoEnabled ?? Acquirer?.BoletoEnabled ?? false);
    
    /// <summary>
    /// Verifica se Cartão de Crédito está habilitado para este merchant
    /// Considera: Acquirer.SupportsCreditCard AND (MerchantAcquirer.CreditCardEnabled ?? Acquirer.CreditCardEnabled)
    /// </summary>
    public bool IsCreditCardEnabled() => Acquirer?.SupportsCreditCard == true && (CreditCardEnabled ?? Acquirer?.CreditCardEnabled ?? false);
}
