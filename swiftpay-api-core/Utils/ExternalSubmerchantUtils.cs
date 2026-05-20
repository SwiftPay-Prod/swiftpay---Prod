using safefy_api_core.Models.Database;

namespace safefy_api_core.Utils;

public static class ExternalSubmerchantUtils
{
    public static bool UsesExternalSubmerchant(ProviderCategory providerCategory)
        => providerCategory == ProviderCategory.PaymentInstitution;

    public static bool IsOperational(ExternalSubmerchantStatus status)
        => status == ExternalSubmerchantStatus.Active;

    public static bool IsTerminal(ExternalSubmerchantStatus status)
        => status == ExternalSubmerchantStatus.Active
           || status == ExternalSubmerchantStatus.Rejected
           || status == ExternalSubmerchantStatus.Suspended
           || status == ExternalSubmerchantStatus.Inactive;

    public static ExternalSubmerchantStatus Parse(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
            return ExternalSubmerchantStatus.Pending;

        var normalized = status.Trim().Replace("-", "_").ToLowerInvariant();

        return normalized switch
        {
            "not_submitted" => ExternalSubmerchantStatus.NotSubmitted,
            "pending" => ExternalSubmerchantStatus.Pending,
            "pending_review" => ExternalSubmerchantStatus.PendingReview,
            "active" => ExternalSubmerchantStatus.Active,
            "rejected" => ExternalSubmerchantStatus.Rejected,
            "suspended" => ExternalSubmerchantStatus.Suspended,
            "inactive" => ExternalSubmerchantStatus.Inactive,
            _ => ExternalSubmerchantStatus.Pending
        };
    }
}
