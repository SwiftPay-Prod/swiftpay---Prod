using swiftpay_api.Endpoints.Admin.Merchants.ReadMerchant;
using swiftpay_api.Endpoints.Models;
using swiftpay_api.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Mappers;

public static class AdminMerchantMapper
{
    public static AdminMerchantData ToData(Merchant merchant, MerchantAcquirer? activeAcquirer = null)
    {
        return new AdminMerchantData
        {
            Id = merchant.Id,
            Name = merchant.Name,
            Email = merchant.Email,
            PhoneNumber = merchant.PhoneNumber,
            WhatsApp = merchant.WhatsApp,
            Status = merchant.Status,
            KycStatus = merchant.KycStatus,
            OnboardingStep = merchant.OnboardingStep,
            User = ToUserData(merchant.User),
            Address = ToAddressData(merchant),
            Acquirer = activeAcquirer != null ? ToAcquirerData(activeAcquirer) : null,
            KycPendingItems = merchant.MerchantKycPendingItems
                .OrderByDescending(i => i.CreatedAt)
                .Select(ToKycPendingItemData)
                .ToList(),
            CreatedAt = merchant.CreatedAt,
            OnboardingCompletedAt = merchant.OnboardingCompletedAt,
            KycSubmittedAt = merchant.KycSubmittedAt,
            KycApprovedAt = merchant.KycApprovedAt,
            SuspendedReason = merchant.SuspendedReason,
            InactiveReason = merchant.InactiveReason
        };
    }

    public static async Task<AdminMerchantData> ToDataWithKycAsync(
        Merchant merchant,
        MerchantAcquirer? activeAcquirer,
        IStorageService storageService)
    {
        var data = ToData(merchant, activeAcquirer);

        if (merchant.MerchantKyc != null)
        {
            data.Kyc = await ToKycDataAsync(merchant.MerchantKyc, storageService);
        }

        return data;
    }

    public static AdminMerchantUserData ToUserData(User user) => new()
    {
        Id = user.Id,
        Name = user.Name,
        Email = user.Email,
        Status = user.Status,
        CreatedAt = user.CreatedAt
    };

    public static AdminMerchantAddressData ToAddressData(Merchant merchant) => new()
    {
        Street = merchant.Address,
        Number = merchant.AddressNumber,
        Complement = merchant.AddressComplement,
        Neighborhood = merchant.Neighborhood,
        City = merchant.City,
        State = merchant.State,
        PostalCode = merchant.PostalCode,
        Country = merchant.Country
    };

    public static AdminMerchantAcquirerData ToAcquirerData(MerchantAcquirer merchantAcquirer) => new()
    {
        UsesSubaccount = ExternalSubmerchantUtils.UsesExternalSubmerchant(merchantAcquirer.Acquirer.ProviderCategory),
        Id = merchantAcquirer.Acquirer.Id,
        Name = merchantAcquirer.Acquirer.Name,
        DisplayName = merchantAcquirer.Acquirer.DisplayName,
        Code = merchantAcquirer.Acquirer.Code,
        Nominal = merchantAcquirer.Acquirer.Nominal,
        LogoUrl = merchantAcquirer.Acquirer.LogoUrl,
        IsActive = merchantAcquirer.IsActive,
        AssignedAt = merchantAcquirer.CreatedAt,
        ExternalSubmerchantId = merchantAcquirer.ExternalSubmerchantId,
        ExternalSubmerchantStatus = ExternalSubmerchantUtils.UsesExternalSubmerchant(merchantAcquirer.Acquirer.ProviderCategory)
            ? merchantAcquirer.ExternalSubmerchantStatus
            : null,
        ExternalOnboardingSubmittedAt = merchantAcquirer.ExternalOnboardingSubmittedAt,
        ExternalOnboardingCompletedAt = merchantAcquirer.ExternalOnboardingCompletedAt,
        ExternalOnboardingRejectionReason = merchantAcquirer.ExternalOnboardingRejectionReason,
        PixInFeeMode = merchantAcquirer.PixInFeeMode,
        PixInFeeFixed = merchantAcquirer.PixInFeeFixed,
        PixInFeePercentage = merchantAcquirer.PixInFeePercentage,
        BoletoInFeeMode = merchantAcquirer.BoletoInFeeMode,
        BoletoInFeeFixed = merchantAcquirer.BoletoInFeeFixed,
        BoletoInFeePercentage = merchantAcquirer.BoletoInFeePercentage,
        CreditCardInFeeMode = merchantAcquirer.CreditCardInFeeMode,
        CreditCardInFeeFixed = merchantAcquirer.CreditCardInFeeFixed,
        CreditCardInFeePercentage = merchantAcquirer.CreditCardInFeePercentage,
        PayoutFeeMode = merchantAcquirer.PayoutFeeMode,
        PayoutFeeFixed = merchantAcquirer.PayoutFeeFixed,
        PayoutFeePercentage = merchantAcquirer.PayoutFeePercentage
    };

    public static AdminMerchantKycPendingItemData ToKycPendingItemData(MerchantKycPendingItem item) => new()
    {
        Id = item.Id,
        Type = item.Type,
        FieldKey = item.FieldKey,
        Title = item.Title,
        Description = item.Description,
        Status = item.Status,
        Response = item.Response,
        RespondedAt = item.RespondedAt,
        EvaluatedAt = item.EvaluatedAt,
        AdminNotes = item.AdminNotes,
        CreatedAt = item.CreatedAt
    };

    public static async Task<AdminMerchantKycData> ToKycDataAsync(
        MerchantKyc kyc,
        IStorageService storageService)
    {
        var kycData = new AdminMerchantKycData
        {
            LegalName = kyc.LegalName,
            DocumentType = kyc.DocumentType,
            DocumentNumber = kyc.DocumentNumber,
            IdentityDocumentType = kyc.IdentityDocumentType,
            IdentityDocumentNumber = kyc.IdentityDocumentNumber,
            OperationType = kyc.OperationType,
            BusinessDescription = kyc.BusinessDescription,
            Website = kyc.Website,
            ExpectedMonthlyVolume = kyc.ExpectedMonthlyVolume,
            MonthlyRevenue = kyc.MonthlyRevenue,
            AverageTicket = kyc.AverageTicket,
            UsesPix = kyc.UsesPix,
            UsesBoleto = kyc.UsesBoleto,
            UsesCreditCard = kyc.UsesCreditCard,
            RejectionReason = kyc.RejectionReason,
            AdminNotes = kyc.AdminNotes
        };

        if (kyc.ProofOfAddressFile != null)
        {
            kycData.ProofOfAddress = await ToFileDataAsync(kyc.ProofOfAddressFile, storageService);
        }

        if (kyc.DocumentFrontFile != null)
        {
            kycData.DocumentFront = await ToFileDataAsync(kyc.DocumentFrontFile, storageService);
        }

        if (kyc.DocumentBackFile != null)
        {
            kycData.DocumentBack = await ToFileDataAsync(kyc.DocumentBackFile, storageService);
        }

        if (kyc.SelfieFile != null)
        {
            kycData.Selfie = await ToFileDataAsync(kyc.SelfieFile, storageService);
        }

        if (kyc.CnpjCardFile != null)
        {
            kycData.CnpjCard = await ToFileDataAsync(kyc.CnpjCardFile, storageService);
        }

        if (kyc.CompanyContractFile != null)
        {
            kycData.CompanyContract = await ToFileDataAsync(kyc.CompanyContractFile, storageService);
        }

        return kycData;
    }

    private static async Task<FileData> ToFileDataAsync(StoredFile file, IStorageService storageService)
    {
        var url = await storageService.GetOrRefreshUrlAsync(file);

        return new FileData
        {
            Id = file.Id,
            OriginalFileName = file.OriginalFileName,
            ContentType = file.ContentType,
            Size = file.Size,
            Url = url,
            ExpiresAt = file.CachedUrlExpiresAt
        };
    }
}
