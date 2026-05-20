using safefy_api.Endpoints.Admin.Acquirers.ReadListAcquirers;
using safefy_api_core.Models.Acquirer;
using safefy_api_core.Models.Database;

namespace safefy_api.Mappers;

public static class AcquirerMapper
{
    /// <summary>
    /// Mapeia um Acquirer para AdminAcquirerData (sem campos sensíveis).
    /// Usa MerchantAcquirers.Count para totalMerchants (requer Include).
    /// </summary>
    public static AdminAcquirerData ToData(Acquirer acquirer, string? paymentApiBaseUrl = null) =>
        ToData(acquirer, acquirer.MerchantAcquirers?.Count ?? 0, includeSensitiveFields: false, includeCredentials: false, paymentApiBaseUrl: paymentApiBaseUrl);

    /// <summary>
    /// Mapeia um Acquirer para AdminAcquirerData com totalMerchants customizado.
    /// </summary>
    public static AdminAcquirerData ToData(Acquirer acquirer, int totalMerchants, bool includeSensitiveFields = false, bool includeCredentials = false, string? paymentApiBaseUrl = null) => new()
    {
        Id = acquirer.Id,
        Name = acquirer.Name,
        Code = acquirer.Code,
        DisplayName = acquirer.DisplayName,
        Description = acquirer.Description,
        Nominal = acquirer.Nominal,
        LogoUrl = acquirer.LogoUrl,
        Type = acquirer.Type.ToString(),
        ProviderCategory = acquirer.ProviderCategory.ToString(),
        OperationTypes = acquirer.OperationTypes.Select(t => t.ToString()).ToList(),
        IsActive = acquirer.IsActive,
        HideFromMerchantNominalSelection = acquirer.HideFromMerchantNominalSelection,
        
        // Clone information
        ClonedFromId = acquirer.ClonedFromId,

        // API Configuration
        ApiBaseUrl = acquirer.ApiBaseUrl,
        ApiBaseUrlProduction = acquirer.ApiBaseUrlProduction,
        ApiBaseUrlSandbox = acquirer.ApiBaseUrlSandbox,
        AuthType = acquirer.AuthType,
        WebhookToken = includeCredentials ? acquirer.WebhookToken : null,
        
        // Credential Schema System
        CredentialSchema = CredentialUtils.ParseSchema(acquirer.CredentialSchema)?.Fields,
        HasDefaultCredentials = !string.IsNullOrEmpty(acquirer.DefaultCredentials) &&
            CredentialUtils.ParseCredentials(acquirer.DefaultCredentials) is { Count: > 0 },
        HasDefaultCredentialsSandbox = !string.IsNullOrEmpty(acquirer.DefaultCredentialsSandbox) &&
            CredentialUtils.ParseCredentials(acquirer.DefaultCredentialsSandbox) is { Count: > 0 },
        DefaultCredentials = includeCredentials ? CredentialUtils.ParseCredentials(acquirer.DefaultCredentials) : null,
        DefaultCredentialsSandbox = includeCredentials ? CredentialUtils.ParseCredentials(acquirer.DefaultCredentialsSandbox) : null,

        // Features - Capabilities
        SupportsPix = acquirer.SupportsPix,
        SupportsCreditCard = acquirer.SupportsCreditCard,
        SupportsBoleto = acquirer.SupportsBoleto,
        SupportsWithdrawal = acquirer.SupportsWithdrawal,
        SupportsRefund = acquirer.SupportsRefund,
        
        // Features - Enabled
        PixEnabled = acquirer.PixEnabled,
        BoletoEnabled = acquirer.BoletoEnabled,
        CreditCardEnabled = acquirer.CreditCardEnabled,

        // Settlement compensation configuration
        PixHasCompensation = acquirer.PixHasCompensation,
        PixCompensationDays = acquirer.PixCompensationDays,
        BoletoHasCompensation = acquirer.BoletoHasCompensation,
        BoletoCompensationDays = acquirer.BoletoCompensationDays,
        CreditCardHasCompensation = acquirer.CreditCardHasCompensation,
        CreditCardCompensationDays = acquirer.CreditCardCompensationDays,

        // Webhook Configuration
        WebhookAuthMode = acquirer.WebhookAuthMode.ToString(),
        HasWebhookToken = !string.IsNullOrEmpty(acquirer.WebhookToken),
        HasWebhookAllowedIps = !string.IsNullOrEmpty(acquirer.WebhookAllowedIps),
        WebhookAllowedIps = includeSensitiveFields ? acquirer.WebhookAllowedIps : null,
        WebhookPath = ResolveWebhookPath(acquirer.Type),
        WebhookUrl = BuildWebhookUrl(paymentApiBaseUrl, acquirer.Type),
        IsWebhookConfigured = IsWebhookConfigured(acquirer),

        // Documentation
        DocumentationUrl = acquirer.DocumentationUrl,
        WebhookDocumentationUrl = acquirer.WebhookDocumentationUrl,

        // Access accounts in acquirer panel/site
        AccessAccounts = acquirer.AccessAccounts,

        // PIX In Fees (Acquirer charges)
        PixInFeeMode = acquirer.PixInFeeMode.ToString(),
        PixInFeeFixed = acquirer.PixInFeeFixed,
        PixInFeePercentage = acquirer.PixInFeePercentage,
        BoletoInFeeMode = acquirer.BoletoInFeeMode.ToString(),
        BoletoInFeeFixed = acquirer.BoletoInFeeFixed,
        BoletoInFeePercentage = acquirer.BoletoInFeePercentage,
        CreditCardInFeeMode = acquirer.CreditCardInFeeMode.ToString(),
        CreditCardInFeeFixed = acquirer.CreditCardInFeeFixed,
        CreditCardInFeePercentage = acquirer.CreditCardInFeePercentage,
        
        // Payout Fees (Acquirer charges)
        PayoutFeeMode = acquirer.PayoutFeeMode.ToString(),
        PayoutFeeFixed = acquirer.PayoutFeeFixed,
        PayoutFeePercentage = acquirer.PayoutFeePercentage,
        PayoutFeeHandling = acquirer.PayoutFeeHandling.ToString(),
        
        // Fee Split Handling (Auto split by acquirer)
        PixFeeSplitHandling = acquirer.PixFeeSplitHandling.ToString(),
        BoletoFeeSplitHandling = acquirer.BoletoFeeSplitHandling.ToString(),
        CreditCardFeeSplitHandling = acquirer.CreditCardFeeSplitHandling.ToString(),

        // Transaction Limits - PIX
        MinPixAmount = acquirer.MinPixAmount,
        MaxPixAmount = acquirer.MaxPixAmount,
        
        // Transaction Limits - Boleto
        MinBoletoAmount = acquirer.MinBoletoAmount,
        MaxBoletoAmount = acquirer.MaxBoletoAmount,
        
        // Transaction Limits - Credit Card
        MinCreditCardAmount = acquirer.MinCreditCardAmount,
        MaxCreditCardAmount = acquirer.MaxCreditCardAmount,
        
        // Transaction Limits - Payout
        MinPayoutAmount = acquirer.MinPayoutAmount,
        MaxPayoutAmount = acquirer.MaxPayoutAmount,

        // Additional Info
        TotalMerchants = totalMerchants,
        CreatedAt = acquirer.CreatedAt,
        UpdatedAt = acquirer.UpdatedAt
    };

    private static bool IsWebhookConfigured(Acquirer acquirer)
    {
        return acquirer.WebhookAuthMode switch
        {
            WebhookAuthMode.None => true,
            WebhookAuthMode.Token => !string.IsNullOrWhiteSpace(acquirer.WebhookToken),
            WebhookAuthMode.Ip => !string.IsNullOrWhiteSpace(acquirer.WebhookAllowedIps),
            WebhookAuthMode.TokenAndIp =>
                !string.IsNullOrWhiteSpace(acquirer.WebhookToken)
                && !string.IsNullOrWhiteSpace(acquirer.WebhookAllowedIps),
            WebhookAuthMode.HmacSha256 => !string.IsNullOrWhiteSpace(acquirer.WebhookToken),
            _ => false
        };
    }

    private static string? ResolveWebhookPath(AcquirerType acquirerType)
    {
        return acquirerType switch
        {
            AcquirerType.ActivePayments => "/v1/internal/activepayments/webhooks",
            AcquirerType.IHubBanking => "/v1/internal/ihubbanking/webhooks",
            AcquirerType.Bankizi => "/v1/internal/bankizi/webhooks",
            AcquirerType.Rapdyn => "/v1/internal/rapdyn/webhooks",
            AcquirerType.Coldfy => "/v1/internal/coldfy/webhooks",
            AcquirerType.Pluggou => "/v1/internal/pluggou/webhooks",
            AcquirerType.HunterPay => "/v1/internal/hunterpay/webhooks",
            AcquirerType.HeartPay => "/v1/internal/heartpay/webhooks",
            AcquirerType.Accithus => "/v1/internal/accithus/webhooks",
            _ => null
        };
    }

    private static string? BuildWebhookUrl(string? paymentApiBaseUrl, AcquirerType acquirerType)
    {
        var path = ResolveWebhookPath(acquirerType);
        if (string.IsNullOrWhiteSpace(path) || string.IsNullOrWhiteSpace(paymentApiBaseUrl))
        {
            return null;
        }

        return $"{paymentApiBaseUrl.TrimEnd('/')}{path}";
    }
}
