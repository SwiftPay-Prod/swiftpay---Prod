using System.ComponentModel;
using System.Text.Json.Serialization;

namespace safefy_api_core.Models.Email;

public static class EmailTemplates
{
    public static string GetTemplateName(EmailTemplate template)
    {
        var field = template.GetType().GetField(template.ToString());
        var attribute = (DescriptionAttribute?)Attribute.GetCustomAttribute(field!, typeof(DescriptionAttribute));
        return attribute?.Description ?? $"{template}.html";
    }
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum EmailTemplate
{
    // ==========================================
    // SAFEFY-API: Autenticação
    // ==========================================

    [Description("Welcome.html")]
    Welcome,

    [Description("EmailConfirmation.html")]
    EmailConfirmation,

    [Description("PasswordReset.html")]
    PasswordReset,

    [Description("PasswordChanged.html")]
    PasswordChanged,

    [Description("PasswordChangeCode.html")]
    PasswordChangeCode,

    // ==========================================
    // SAFEFY-API: Segurança
    // ==========================================

    [Description("AccountLocked.html")]
    AccountLocked,

    [Description("AccountInactivated.html")]
    AccountInactivated,

    [Description("AccountSuspended.html")]
    AccountSuspended,

    [Description("SuspiciousLogin.html")]
    SuspiciousLogin,

    [Description("DeviceVerification.html")]
    DeviceVerification,

    [Description("DeviceAdded.html")]
    DeviceAdded,

    // ==========================================
    // SAFEFY-API: Credenciais de API
    // ==========================================

    [Description("ApiCredentialCode.html")]
    ApiCredentialCode,

    [Description("ApiCredentialCreated.html")]
    ApiCredentialCreated,

    [Description("ApiCredentialRevoked.html")]
    ApiCredentialRevoked,

    [Description("ApiCredentialRegenerated.html")]
    ApiCredentialRegenerated,

    // ==========================================
    // SAFEFY-API: KYC / Onboarding
    // ==========================================

    [Description("KycSubmitted.html")]
    KycSubmitted,

    [Description("KycApproved.html")]
    KycApproved,

    [Description("KycRejected.html")]
    KycRejected,

    [Description("KycComplement.html")]
    KycComplement,

    // ==========================================
    // SAFEFY-API: Merchant
    // ==========================================

    [Description("MerchantDeletionCode.html")]
    MerchantDeletionCode,

    [Description("MerchantDeleted.html")]
    MerchantDeleted,

    [Description("MerchantSuspended.html")]
    MerchantSuspended,

    [Description("MerchantInactivated.html")]
    MerchantInactivated,

    // ==========================================
    // SAFEFY-API: Contas de Saque (Payout Accounts)
    // ==========================================

    [Description("PayoutAccountActionVerification.html")]
    PayoutAccountActionVerification,

    [Description("ReferralPayoutPixKeyVerification.html")]
    ReferralPayoutPixKeyVerification,

    [Description("PayoutAccountCreated.html")]
    PayoutAccountCreated,

    [Description("PayoutRequested.html")]
    PayoutRequested,

    // ==========================================
    // SAFEFY-API: Admin
    // ==========================================

    [Description("AdminPasswordReset.html")]
    AdminPasswordReset,

    // ==========================================
    // SAFEFY-API-PAYMENT: Pagamentos
    // ==========================================

    [Description("PaymentReceived.html")]
    PaymentReceived,

    [Description("PaymentExpired.html")]
    PaymentExpired,

    // ==========================================
    // SAFEFY-API-PAYMENT: Saques
    // ==========================================

    [Description("PayoutCompleted.html")]
    PayoutCompleted,

    [Description("PayoutFailed.html")]
    PayoutFailed,

    [Description("PayoutRejected.html")]
    PayoutRejected,

    // ==========================================
    // SAFEFY-API-PAYMENT: Webhooks
    // ==========================================

    [Description("WebhookFailed.html")]
    WebhookFailed
}
