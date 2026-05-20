using safefy_api.Endpoints.Admin.Merchants.ReadListMerchants;
using safefy_api_core.Models.Database;
using safefy_api_core.Utils;

namespace safefy_api.Mappers;

public static class AdminMinimalMerchantMapper
{
    public static AdminMinimalMerchant ToMinimalData(
        Merchant merchant,
        long lifetimeVolume = 0,
        long totalFeesPaid = 0,
        long availableBalance = 0,
        bool isNominalAbTestActive = false)
    {
        var activeAcquirer = merchant.MerchantAcquirers?.FirstOrDefault(ma => ma.IsActive);
        var usesSubaccount = activeAcquirer != null
            && ExternalSubmerchantUtils.UsesExternalSubmerchant(activeAcquirer.Acquirer.ProviderCategory);

        return new AdminMinimalMerchant
        {
            Id = merchant.Id,
            UserId = merchant.UserId,
            UserName = merchant.User?.Name,
            UserEmail = merchant.User?.Email,
            Name = merchant.Name,
            Document = merchant.MerchantKyc?.DocumentNumber,
            Email = merchant.Email,
            Status = merchant.Status,
            KycStatus = merchant.KycStatus,
            OnboardingStep = merchant.OnboardingStep,
            AcquirerId = activeAcquirer?.AcquirerId,
            AcquirerName = activeAcquirer?.Acquirer?.DisplayName ?? activeAcquirer?.Acquirer?.Name,
            AcquirerCode = activeAcquirer?.Acquirer?.Code,
            AcquirerNominal = activeAcquirer?.Acquirer?.Nominal,
            AcquirerLogoUrl = activeAcquirer?.Acquirer?.LogoUrl,
            UsesSubaccount = usesSubaccount,
            ExternalSubmerchantId = usesSubaccount ? activeAcquirer?.ExternalSubmerchantId : null,
            ExternalSubmerchantStatus = usesSubaccount ? activeAcquirer?.ExternalSubmerchantStatus : null,
            IsNominalAbTestActive = isNominalAbTestActive,
            AcquirerOperationTypes = activeAcquirer?.Acquirer?.OperationTypes.Select(t => t.ToString()).ToList() ?? [],
            LifetimeVolume = lifetimeVolume,
            TotalFeesPaid = totalFeesPaid,
            AvailableBalance = availableBalance,
            PixApiFeeMode = merchant.MerchantSettings?.PixApiFeeMode,
            PixApiFeeFixed = merchant.MerchantSettings?.PixApiFeeFixed,
            PixApiFeePercentage = merchant.MerchantSettings?.PixApiFeePercentage,
            CreatedAt = merchant.CreatedAt,
            KycSubmittedAt = merchant.KycSubmittedAt
        };
    }
}
