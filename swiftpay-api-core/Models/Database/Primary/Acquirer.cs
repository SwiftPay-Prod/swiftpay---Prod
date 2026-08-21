using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace swiftpay_api_core.Models.Database;

public class Acquirer : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;
    public string Code { get; set; } = null!; // Unique code: bankizi, pagarme, stripe
    public string? Description { get; set; }
    public string? Nominal { get; set; }
    public string? LogoUrl { get; set; }
    public AcquirerType Type { get; set; }
    public ProviderCategory ProviderCategory { get; set; } = ProviderCategory.Acquirer;
    public List<AcquirerOperationType> OperationTypes { get; set; } = [AcquirerOperationType.White];
    public bool IsActive { get; set; } = true;
    public bool HideFromMerchantNominalSelection { get; set; } = false;

    // API Configuration
    public string? ApiBaseUrl { get; set; }
    public string? ApiBaseUrlProduction { get; set; }
    public string? ApiBaseUrlSandbox { get; set; }
    public string? AuthType { get; set; } // client_credentials, api_key, bearer

    // ==========================================
    // CREDENCIAIS GENÉRICAS (JSON)
    // ==========================================

    /// <summary>
    /// Schema JSON que define os campos de credenciais necessários para esta adquirente.
    /// Ex: { "fields": [{ "key": "secretKey", "label": "Secret Key", "type": "secret", "required": true }] }
    /// </summary>
    public string? CredentialSchema { get; set; }

    /// <summary>
    /// Credenciais padrão (Production) em formato JSON.
    /// Ex: { "secretKey": "sk_live_...", "companyId": "COMPANY_001" }
    /// </summary>
    public string? DefaultCredentials { get; set; }

    /// <summary>
    /// Credenciais padrão (Sandbox) em formato JSON.
    /// Ex: { "secretKey": "sk_test_...", "companyId": "COMPANY_TEST" }
    /// </summary>
    public string? DefaultCredentialsSandbox { get; set; }

    // Features - Capabilities (o que a adquirente suporta tecnicamente)
    public bool SupportsPix { get; set; } = true;
    public bool SupportsBoleto { get; set; } = false;
    public bool SupportsCreditCard { get; set; } = false;
    public bool SupportsWithdrawal { get; set; } = true;
    public bool SupportsRefund { get; set; } = true;
    
    // Features - Enabled (operações habilitadas para uso nesta instância)
    public bool PixEnabled { get; set; } = true;
    public bool BoletoEnabled { get; set; } = false;
    public bool CreditCardEnabled { get; set; } = false;

    // Settlement compensation configuration
    public bool PixHasCompensation { get; set; } = false;
    public int PixCompensationDays { get; set; } = 0;
    public bool BoletoHasCompensation { get; set; } = false;
    public int BoletoCompensationDays { get; set; } = 0;
    public bool CreditCardHasCompensation { get; set; } = false;
    public int CreditCardCompensationDays { get; set; } = 0;
    
    // Clone information
    public Guid? ClonedFromId { get; set; }
    public string? DisplayName { get; set; } // Nome de exibição customizado (ex: "ActivePayments - Black")

    // ==========================================
    // LIMITES DE TRANSAÇÃO PIX
    // ==========================================
    
    /// <summary>
    /// Valor mínimo de transação PIX em centavos
    /// </summary>
    public long MinPixAmount { get; set; } = 100;
    
    /// <summary>
    /// Valor máximo de transação PIX em centavos (0 = sem limite)
    /// </summary>
    public long MaxPixAmount { get; set; } = 0;

    // ==========================================
    // LIMITES DE TRANSAÇÃO BOLETO
    // ==========================================
    
    /// <summary>
    /// Valor mínimo de transação Boleto em centavos
    /// </summary>
    public long MinBoletoAmount { get; set; } = 500;
    
    /// <summary>
    /// Valor máximo de transação Boleto em centavos (0 = sem limite)
    /// </summary>
    public long MaxBoletoAmount { get; set; } = 0;

    // ==========================================
    // LIMITES DE TRANSAÇÃO CARTÃO DE CRÉDITO
    // ==========================================
    
    /// <summary>
    /// Valor mínimo de transação Cartão em centavos
    /// </summary>
    public long MinCreditCardAmount { get; set; } = 100;
    
    /// <summary>
    /// Valor máximo de transação Cartão em centavos (0 = sem limite)
    /// </summary>
    public long MaxCreditCardAmount { get; set; } = 0;

    // ==========================================
    // LIMITES DE SAQUE (PAYOUT)
    // ==========================================
    
    /// <summary>
    /// Valor mínimo de saque em centavos
    /// </summary>
    public long MinPayoutAmount { get; set; } = 100;
    
    /// <summary>
    /// Valor máximo de saque em centavos (0 = sem limite)
    /// </summary>
    public long MaxPayoutAmount { get; set; } = 0;

    // Webhook Authentication
    public WebhookAuthMode WebhookAuthMode { get; set; } = WebhookAuthMode.Token;
    public string? WebhookToken { get; set; }
    public string? WebhookAllowedIps { get; set; }

    // Documentation
    public string? DocumentationUrl { get; set; }
    public string? WebhookDocumentationUrl { get; set; }

    // ==========================================
    // TAXAS DE PROCESSAMENTO PIX (PIX IN)
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

    /// <summary>
    /// Define como a adquirente trata a taxa de saque.
    /// FeeDeductedFromTransfer: A taxa é deduzida do valor transferido (precisamos enviar valor + taxa).
    /// FeeAddedToDebit: A taxa é adicionada ao débito (enviamos o valor exato).
    /// </summary>
    public PayoutFeeHandling PayoutFeeHandling { get; set; } = PayoutFeeHandling.FeeDeductedFromTransfer;

    // ==========================================
    // SPLIT AUTOMÁTICO DE TAXAS (FEE SPLIT)
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

    /// <summary>
    /// Contas utilizadas para acesso ao painel/site da adquirente.
    /// </summary>
    public List<AcquirerPortalAccessAccount> AccessAccounts { get; set; } = [];

    // Relationships
    public ICollection<MerchantAcquirer> MerchantAcquirers { get; set; } = [];
    public ICollection<Account> Accounts { get; set; } = [];
}

public sealed class AcquirerPortalAccessAccount
{
    public string Login { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? Description { get; set; }
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum AcquirerType
{
    Bankizi,
    IHubBanking,
    ActivePayments,
    Rapdyn,
    Coldfy,
    Pluggou,
    HunterPay,
    HeartPay,
    Accithus,
    MagicPay,
    AkkadPag,
    FlevoPay,
    PixHub
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ProviderCategory
{
    Acquirer,
    PaymentInstitution
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ExternalSubmerchantStatus
{
    NotSubmitted,
    Pending,
    PendingReview,
    Active,
    Rejected,
    Suspended,
    Inactive
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum AcquirerOperationType
{
    /// <summary>
    /// Operações White Label (faturamento direto)
    /// </summary>
    White,
    
    /// <summary>
    /// Operações Black (alto risco)
    /// </summary>
    Black
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum WebhookAuthMode
{
    None,
    Token,
    Ip,
    TokenAndIp,
    HmacSha256
}
