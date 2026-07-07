using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api.Validators;
using swiftpay_api_core.Models.Acquirer;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Admin.Acquirers.ReadListAcquirers;

public sealed class ReadListAcquirersRequest : IPaginatedRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public bool? IsActive { get; set; }
    public ProviderCategory? ProviderCategory { get; set; }
    public string? Search { get; set; }
}

public sealed class ReadListAcquirersRequestValidator : Validator<ReadListAcquirersRequest>
{
    public ReadListAcquirersRequestValidator()
    {
        RuleFor(x => x.Page).ValidPage();
        RuleFor(x => x.PageSize).ValidPageSize();
    }
}

public sealed class ReadListAcquirersResponse : BaseResponse<Paginated<AdminAcquirerData>>;

public sealed class AdminAcquirerData
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string Code { get; set; } = null!;
    public string? DisplayName { get; set; }
    public string? Description { get; set; }
    public string? Nominal { get; set; }
    public string? LogoUrl { get; set; }
    public string Type { get; set; } = null!;
    public string ProviderCategory { get; set; } = null!;
    public List<string> OperationTypes { get; set; } = [];
    public bool IsActive { get; set; }
    public bool HideFromMerchantNominalSelection { get; set; }
    
    // Clone information
    public Guid? ClonedFromId { get; set; }
    
    // API Configuration (masked for security)
    public string? ApiBaseUrl { get; set; }
    public string? ApiBaseUrlProduction { get; set; }
    public string? ApiBaseUrlSandbox { get; set; }
    public string? AuthType { get; set; }
    public string? WebhookToken { get; set; }
    
    // Credential Schema System
    public List<CredentialFieldSchema>? CredentialSchema { get; set; }
    public bool HasDefaultCredentials { get; set; }
    public bool HasDefaultCredentialsSandbox { get; set; }
    public Dictionary<string, string>? DefaultCredentials { get; set; }
    public Dictionary<string, string>? DefaultCredentialsSandbox { get; set; }
    
    // Features - Capabilities (o que a adquirente suporta tecnicamente)
    public bool SupportsPix { get; set; }
    public bool SupportsCreditCard { get; set; }
    public bool SupportsBoleto { get; set; }
    public bool SupportsWithdrawal { get; set; }
    public bool SupportsRefund { get; set; }
    
    // Features - Enabled (operações habilitadas nesta instância)
    public bool PixEnabled { get; set; }
    public bool BoletoEnabled { get; set; }
    public bool CreditCardEnabled { get; set; }

    // Settlement compensation configuration
    public bool PixHasCompensation { get; set; }
    public int PixCompensationDays { get; set; }
    public bool BoletoHasCompensation { get; set; }
    public int BoletoCompensationDays { get; set; }
    public bool CreditCardHasCompensation { get; set; }
    public int CreditCardCompensationDays { get; set; }
    
    // Webhook Configuration
    public string WebhookAuthMode { get; set; } = null!;
    public bool HasWebhookToken { get; set; }
    public bool HasWebhookAllowedIps { get; set; }
    public string? WebhookAllowedIps { get; set; }
    public string? WebhookPath { get; set; }
    public string? WebhookUrl { get; set; }
    public bool IsWebhookConfigured { get; set; }
    
    // Documentation
    public string? DocumentationUrl { get; set; }
    public string? WebhookDocumentationUrl { get; set; }

    // Access accounts in acquirer panel/site
    public List<AcquirerPortalAccessAccount> AccessAccounts { get; set; } = [];
    
    // PIX In Fees (Acquirer charges)
    public string? PixInFeeMode { get; set; }
    public long? PixInFeeFixed { get; set; }
    public int? PixInFeePercentage { get; set; }

    // BOLETO In Fees (Acquirer charges)
    public string? BoletoInFeeMode { get; set; }
    public long? BoletoInFeeFixed { get; set; }
    public int? BoletoInFeePercentage { get; set; }

    // CREDIT CARD In Fees (Acquirer charges)
    public string? CreditCardInFeeMode { get; set; }
    public long? CreditCardInFeeFixed { get; set; }
    public int? CreditCardInFeePercentage { get; set; }
    
    // Payout Fees (Acquirer charges)
    public string? PayoutFeeMode { get; set; }
    public long? PayoutFeeFixed { get; set; }
    public int? PayoutFeePercentage { get; set; }
    public string PayoutFeeHandling { get; set; } = null!;
    
    // Fee Split Handling (Auto split by acquirer)
    public string PixFeeSplitHandling { get; set; } = null!;
    public string BoletoFeeSplitHandling { get; set; } = null!;
    public string CreditCardFeeSplitHandling { get; set; } = null!;
    
    // Transaction Limits - PIX
    public long MinPixAmount { get; set; }
    public long MaxPixAmount { get; set; }
    
    // Transaction Limits - Boleto
    public long MinBoletoAmount { get; set; }
    public long MaxBoletoAmount { get; set; }
    
    // Transaction Limits - Credit Card
    public long MinCreditCardAmount { get; set; }
    public long MaxCreditCardAmount { get; set; }
    
    // Transaction Limits - Payout
    public long MinPayoutAmount { get; set; }
    public long MaxPayoutAmount { get; set; }
    
    // Additional Info
    public int TotalMerchants { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
