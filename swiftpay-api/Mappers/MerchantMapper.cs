using safefy_api.Endpoints.Merchants.Shared.Models;
using safefy_api.Endpoints.Models;
using safefy_api.Interfaces;
using safefy_api_core.Models.Database;

namespace safefy_api.Mappers;

public static class MerchantMapper
{
    public static MerchantData ToData(Merchant merchant, PlatformSettings? platformSettings = null)
    {
        return new MerchantData
        {
            Id = merchant.Id,
            Name = merchant.Name,
            Email = merchant.Email,
            PhoneNumber = merchant.PhoneNumber,
            WhatsApp = merchant.WhatsApp,
            Status = merchant.Status.ToString(),
            KycStatus = merchant.KycStatus.ToString(),
            OnboardingStep = merchant.OnboardingStep.ToString(),
            SuspendedReason = merchant.SuspendedReason,
            InactiveReason = merchant.InactiveReason,
            Address = new AddressData
            {
                Street = merchant.Address,
                Number = merchant.AddressNumber,
                Complement = merchant.AddressComplement,
                Neighborhood = merchant.Neighborhood,
                City = merchant.City,
                State = merchant.State,
                PostalCode = merchant.PostalCode,
                Country = merchant.Country
            },
            Kyc = merchant.MerchantKyc != null ? new MerchantKycData
            {
                LegalName = merchant.MerchantKyc.LegalName,
                DocumentType = merchant.MerchantKyc.DocumentType?.ToString(),
                DocumentNumber = merchant.MerchantKyc.DocumentNumber,
                IdentityDocumentType = merchant.MerchantKyc.IdentityDocumentType?.ToString(),
                IdentityDocumentNumber = merchant.MerchantKyc.IdentityDocumentNumber,
                OperationType = merchant.MerchantKyc.OperationType?.ToString(),
                BusinessDescription = merchant.MerchantKyc.BusinessDescription,
                Website = merchant.MerchantKyc.Website,
                MonthlyRevenue = merchant.MerchantKyc.MonthlyRevenue,
                AverageTicket = merchant.MerchantKyc.AverageTicket,
                UsesPix = merchant.MerchantKyc.UsesPix,
                UsesBoleto = merchant.MerchantKyc.UsesBoleto,
                UsesCreditCard = merchant.MerchantKyc.UsesCreditCard,
                RejectionReason = merchant.MerchantKyc.RejectionReason,
                AdminNotes = merchant.MerchantKyc.AdminNotes
            } : null,
            Fees = ToFeesData(merchant.MerchantSettings, platformSettings),
            KycPendingItems = merchant.MerchantKycPendingItems
                .Select(item => new MerchantKycPendingItemData
                {
                    Id = item.Id,
                    Type = item.Type.ToString(),
                    FieldKey = item.FieldKey?.ToString(),
                    Title = item.Title,
                    Description = item.Description,
                    Status = item.Status.ToString(),
                    Response = item.Response,
                    RespondedAt = item.RespondedAt,
                    EvaluatedAt = item.EvaluatedAt,
                    AdminNotes = item.AdminNotes,
                    CreatedAt = item.CreatedAt
                })
                .ToList(),
            CreatedAt = merchant.CreatedAt,
            OnboardingCompletedAt = merchant.OnboardingCompletedAt
        };
    }

    public static MerchantFeesData? ToFeesData(MerchantSettings? settings, PlatformSettings? platformSettings)
    {
        if (platformSettings == null)
        {
            return null;
        }

        return new MerchantFeesData
        {
            PixApiFeeMode = settings?.PixApiFeeMode ?? platformSettings.PixApiFeeMode,
            PixApiFeeFixed = settings?.PixApiFeeFixed ?? platformSettings.PixApiFeeFixed,
            PixApiFeePercentage = settings?.PixApiFeePercentage ?? platformSettings.PixApiFeePercentage,
            PixCheckoutFeeMode = settings?.PixCheckoutFeeMode ?? platformSettings.PixCheckoutFeeMode,
            PixCheckoutFeeFixed = settings?.PixCheckoutFeeFixed ?? platformSettings.PixCheckoutFeeFixed,
            PixCheckoutFeePercentage = settings?.PixCheckoutFeePercentage ?? platformSettings.PixCheckoutFeePercentage,
            WithdrawalFeeMode = settings?.WithdrawalFeeMode ?? platformSettings.WithdrawalFeeMode,
            WithdrawalFeeFixed = settings?.WithdrawalFeeFixed ?? platformSettings.WithdrawalFeeFixed,
            WithdrawalFeePercentage = settings?.WithdrawalFeePercentage ?? platformSettings.WithdrawalFeePercentage,
            MinWithdrawalAmount = settings?.MinWithdrawalAmount ?? platformSettings.MinWithdrawalAmount
        };
    }

    public static async Task<MerchantData> ToDataWithDocumentsAsync(Merchant merchant, IStorageService storageService, PlatformSettings? platformSettings = null)
    {
        var data = ToData(merchant, platformSettings);

        if (merchant.MerchantKyc != null && data.Kyc != null)
        {
            if (merchant.MerchantKyc.ProofOfAddressFile != null)
            {
                data.Kyc.ProofOfAddress = await ToFileDataAsync(merchant.MerchantKyc.ProofOfAddressFile, storageService);
            }

            if (merchant.MerchantKyc.DocumentFrontFile != null)
            {
                data.Kyc.DocumentFront = await ToFileDataAsync(merchant.MerchantKyc.DocumentFrontFile, storageService);
            }

            if (merchant.MerchantKyc.DocumentBackFile != null)
            {
                data.Kyc.DocumentBack = await ToFileDataAsync(merchant.MerchantKyc.DocumentBackFile, storageService);
            }

            if (merchant.MerchantKyc.SelfieFile != null)
            {
                data.Kyc.Selfie = await ToFileDataAsync(merchant.MerchantKyc.SelfieFile, storageService);
            }

            if (merchant.MerchantKyc.CnpjCardFile != null)
            {
                data.Kyc.CnpjCard = await ToFileDataAsync(merchant.MerchantKyc.CnpjCardFile, storageService);
            }

            if (merchant.MerchantKyc.CompanyContractFile != null)
            {
                data.Kyc.CompanyContract = await ToFileDataAsync(merchant.MerchantKyc.CompanyContractFile, storageService);
            }
        }

        return data;
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
