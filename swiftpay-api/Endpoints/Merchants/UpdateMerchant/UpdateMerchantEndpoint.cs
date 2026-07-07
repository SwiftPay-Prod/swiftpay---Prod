using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api.Endpoints.Merchants.Shared;
using swiftpay_api.Interfaces;
using swiftpay_api.Mappers;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Interfaces;

namespace swiftpay_api.Endpoints.Merchants.UpdateMerchant;

public sealed class UpdateMerchantEndpoint(
    PrimaryDbContext dbContext,
    ISecurityLogService securityLog,
    IStorageService storageService
) : Endpoint<UpdateMerchantRequest, UpdateMerchantResponse>
{
    public override void Configure()
    {
        Verbs(Http.PATCH);
        Routes("{id:guid}", "{id:guid}/onboarding");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(UpdateMerchantRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new UpdateMerchantResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .Include(m => m.MerchantKyc)
                .ThenInclude(k => k!.ProofOfAddressFile)
            .Include(m => m.MerchantKyc)
                .ThenInclude(k => k!.DocumentFrontFile)
            .Include(m => m.MerchantKyc)
                .ThenInclude(k => k!.DocumentBackFile)
            .Include(m => m.MerchantKyc)
                .ThenInclude(k => k!.SelfieFile)
            .Include(m => m.MerchantKyc)
                .ThenInclude(k => k!.CnpjCardFile)
            .Include(m => m.MerchantKyc)
                .ThenInclude(k => k!.CompanyContractFile)
            .Include(m => m.MerchantKycPendingItems)
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.Id && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new UpdateMerchantResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var canUpdate =
            (merchant.Status == MerchantStatus.Draft && merchant.KycStatus == MerchantKycStatus.Draft) ||
            (merchant.Status == MerchantStatus.Active && merchant.KycStatus == MerchantKycStatus.Complement);
        
        if (!canUpdate)
        {
            await Send.ResponseAsync(new UpdateMerchantResponse
            {
                Error = new("Apenas organizações em rascunho ou complemento podem ser atualizadas.")
            }, 400, ct);
        return;
        }

        if (merchant.Status == MerchantStatus.Active && merchant.KycStatus == MerchantKycStatus.Complement)
        {
            var openFieldKeys = merchant.MerchantKycPendingItems
                .Where(i => i.Status == MerchantKycPendingItemStatus.Pending && i.FieldKey.HasValue)
                .Select(i => i.FieldKey!.Value)
                .ToHashSet();

            if (openFieldKeys.Count > 0)
            {
                var requestedFieldKeys = CollectRequestedFieldKeys(req);
                var blockedFieldKeys = requestedFieldKeys
                    .Where(field => !openFieldKeys.Contains(field))
                    .ToList();

                if (blockedFieldKeys.Count > 0)
                {
                    await Send.ResponseAsync(new UpdateMerchantResponse
                    {
                        Error = new($"No modo de complemento, só é permitido editar os campos solicitados. Campos bloqueados: {string.Join(", ", blockedFieldKeys)}")
                    }, 400, ct);
                    return;
                }
            }
        }

        UpdateMerchantBasicInfo(merchant, req);
        UpdateMerchantAddress(merchant, req);
        UpdateMerchantKyc(merchant, req);
        UpdateOnboardingStep(merchant);

        if (merchant.Status == MerchantStatus.Active && merchant.KycStatus == MerchantKycStatus.Complement)
        {
            var validationErrors = MerchantValidator.ValidateOnboardingComplete(merchant);
            if (validationErrors.Count > 0)
            {
                await Send.ResponseAsync(new UpdateMerchantResponse
                {
                    Error = new(string.Join(" ", validationErrors))
                }, 400, ct);
                return;
            }
        }

        merchant.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(ct);

        await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.MerchantUpdated, Status = SecurityLogStatus.Success, UserId = userId, Details = $"Merchant updated: {merchant.Id}" });

        var data = await MerchantMapper.ToDataWithDocumentsAsync(merchant, storageService);
        await dbContext.SaveChangesAsync(ct);

        await Send.ResponseAsync(new UpdateMerchantResponse
        {
            Data = data
        }, cancellation: ct);
    }

    private static void UpdateMerchantBasicInfo(Merchant merchant, UpdateMerchantRequest req)
    {
        if (req.Name != null) merchant.Name = req.Name;
        if (req.Email != null) merchant.Email = req.Email;
        if (req.PhoneNumber != null) merchant.PhoneNumber = SanitizeUtils.SanitizePhone(req.PhoneNumber);
        if (req.WhatsApp != null) merchant.WhatsApp = SanitizeUtils.SanitizePhone(req.WhatsApp);
    }

    private static void UpdateMerchantAddress(Merchant merchant, UpdateMerchantRequest req)
    {
        if (req.Address != null) merchant.Address = req.Address;
        if (req.AddressNumber != null) merchant.AddressNumber = req.AddressNumber;
        if (req.AddressComplement != null) merchant.AddressComplement = req.AddressComplement;
        if (req.Neighborhood != null) merchant.Neighborhood = req.Neighborhood;
        if (req.City != null) merchant.City = req.City;
        if (req.State != null) merchant.State = req.State;
        if (req.PostalCode != null) merchant.PostalCode = req.PostalCode;
        if (req.Country != null) merchant.Country = req.Country;
    }

    private static void UpdateMerchantKyc(Merchant merchant, UpdateMerchantRequest req)
    {
        if (merchant.MerchantKyc == null) return;

        if (req.LegalName != null) merchant.MerchantKyc.LegalName = req.LegalName;
        if (req.DocumentType.HasValue) merchant.MerchantKyc.DocumentType = req.DocumentType;
        if (req.DocumentNumber != null) merchant.MerchantKyc.DocumentNumber = SanitizeUtils.SanitizeDocument(req.DocumentNumber);
        if (req.IdentityDocumentType.HasValue) merchant.MerchantKyc.IdentityDocumentType = req.IdentityDocumentType;
        if (req.IdentityDocumentNumber != null) merchant.MerchantKyc.IdentityDocumentNumber = SanitizeUtils.SanitizeDocument(req.IdentityDocumentNumber);
        if (req.OperationType.HasValue) merchant.MerchantKyc.OperationType = req.OperationType;
        if (req.BusinessDescription != null) merchant.MerchantKyc.BusinessDescription = req.BusinessDescription;
        if (req.Website != null) merchant.MerchantKyc.Website = req.Website;
        if (req.MonthlyRevenue.HasValue) merchant.MerchantKyc.MonthlyRevenue = req.MonthlyRevenue;
        if (req.AverageTicket.HasValue) merchant.MerchantKyc.AverageTicket = req.AverageTicket;
        if (req.UsesPix.HasValue) merchant.MerchantKyc.UsesPix = req.UsesPix.Value;
        if (req.UsesBoleto.HasValue) merchant.MerchantKyc.UsesBoleto = req.UsesBoleto.Value;
        if (req.UsesCreditCard.HasValue) merchant.MerchantKyc.UsesCreditCard = req.UsesCreditCard.Value;

        // Document File IDs - Guid.Empty significa remover o arquivo
        if (req.ProofOfAddressFileId.HasValue)
            merchant.MerchantKyc.ProofOfAddressFileId = req.ProofOfAddressFileId == Guid.Empty ? null : req.ProofOfAddressFileId;
        if (req.DocumentFrontFileId.HasValue)
            merchant.MerchantKyc.DocumentFrontFileId = req.DocumentFrontFileId == Guid.Empty ? null : req.DocumentFrontFileId;
        if (req.DocumentBackFileId.HasValue)
            merchant.MerchantKyc.DocumentBackFileId = req.DocumentBackFileId == Guid.Empty ? null : req.DocumentBackFileId;
        if (req.CnpjCardFileId.HasValue)
            merchant.MerchantKyc.CnpjCardFileId = req.CnpjCardFileId == Guid.Empty ? null : req.CnpjCardFileId;
        if (req.CompanyContractFileId.HasValue)
            merchant.MerchantKyc.CompanyContractFileId = req.CompanyContractFileId == Guid.Empty ? null : req.CompanyContractFileId;
        if (req.SelfieFileId.HasValue)
            merchant.MerchantKyc.SelfieFileId = req.SelfieFileId == Guid.Empty ? null : req.SelfieFileId;

        merchant.MerchantKyc.UpdatedAt = DateTime.UtcNow;
    }

    private static void UpdateOnboardingStep(Merchant merchant)
    {
        var hasBasicInfo = !string.IsNullOrEmpty(merchant.Name) &&
                          !string.IsNullOrEmpty(merchant.Email) &&
                          !string.IsNullOrEmpty(merchant.WhatsApp);

        var hasAddress = !string.IsNullOrEmpty(merchant.Address) &&
                        !string.IsNullOrEmpty(merchant.City) &&
                        !string.IsNullOrEmpty(merchant.State) &&
                        !string.IsNullOrEmpty(merchant.PostalCode) &&
                        !string.IsNullOrEmpty(merchant.Country);

        var hasDocuments = merchant.MerchantKyc != null &&
                          merchant.MerchantKyc.DocumentType.HasValue &&
                          !string.IsNullOrEmpty(merchant.MerchantKyc.DocumentNumber) &&
                          !string.IsNullOrEmpty(merchant.MerchantKyc.LegalName) &&
                          merchant.MerchantKyc.IdentityDocumentType.HasValue &&
                          !string.IsNullOrEmpty(merchant.MerchantKyc.IdentityDocumentNumber) &&
                          merchant.MerchantKyc.OperationType.HasValue &&
                          merchant.MerchantKyc.DocumentFrontFileId.HasValue &&
                          merchant.MerchantKyc.DocumentBackFileId.HasValue &&
                          merchant.MerchantKyc.SelfieFileId.HasValue &&
                          (merchant.MerchantKyc.DocumentType == MerchantKycDocumentType.CPF
                              ? merchant.MerchantKyc.ProofOfAddressFileId.HasValue
                              : merchant.MerchantKyc.CnpjCardFileId.HasValue) &&
                          (MerchantValidator.RequiresCompanyContract(merchant.MerchantKyc)
                              ? merchant.MerchantKyc.CompanyContractFileId.HasValue
                              : true);

        var hasBilling = merchant.MerchantKyc != null &&
                        !string.IsNullOrEmpty(merchant.MerchantKyc.Website) &&
                        !string.IsNullOrEmpty(merchant.MerchantKyc.BusinessDescription) &&
                        merchant.MerchantKyc.MonthlyRevenue.HasValue &&
                        merchant.MerchantKyc.AverageTicket.HasValue &&
                        (merchant.MerchantKyc.UsesPix || merchant.MerchantKyc.UsesBoleto || merchant.MerchantKyc.UsesCreditCard);

        if (hasBilling && hasDocuments && hasAddress && hasBasicInfo)
            merchant.OnboardingStep = MerchantOnboardingStep.Review;
        else if (hasDocuments && hasAddress && hasBasicInfo)
            merchant.OnboardingStep = MerchantOnboardingStep.Billing;
        else if (hasAddress && hasBasicInfo)
            merchant.OnboardingStep = MerchantOnboardingStep.Documents;
        else if (hasBasicInfo)
            merchant.OnboardingStep = MerchantOnboardingStep.Address;
        else
            merchant.OnboardingStep = MerchantOnboardingStep.BasicInfo;
    }

    private static HashSet<MerchantKycPendingField> CollectRequestedFieldKeys(UpdateMerchantRequest req)
    {
        var fields = new HashSet<MerchantKycPendingField>();

        if (req.Name != null) fields.Add(MerchantKycPendingField.Name);
        if (req.Email != null) fields.Add(MerchantKycPendingField.Email);
        if (req.PhoneNumber != null) fields.Add(MerchantKycPendingField.PhoneNumber);
        if (req.WhatsApp != null) fields.Add(MerchantKycPendingField.WhatsApp);

        if (req.Address != null) fields.Add(MerchantKycPendingField.Address);
        if (req.AddressNumber != null) fields.Add(MerchantKycPendingField.AddressNumber);
        if (req.AddressComplement != null) fields.Add(MerchantKycPendingField.AddressComplement);
        if (req.Neighborhood != null) fields.Add(MerchantKycPendingField.Neighborhood);
        if (req.City != null) fields.Add(MerchantKycPendingField.City);
        if (req.State != null) fields.Add(MerchantKycPendingField.State);
        if (req.PostalCode != null) fields.Add(MerchantKycPendingField.PostalCode);
        if (req.Country != null) fields.Add(MerchantKycPendingField.Country);

        if (req.LegalName != null) fields.Add(MerchantKycPendingField.LegalName);
        if (req.DocumentType.HasValue) fields.Add(MerchantKycPendingField.DocumentType);
        if (req.DocumentNumber != null) fields.Add(MerchantKycPendingField.DocumentNumber);
        if (req.IdentityDocumentType.HasValue) fields.Add(MerchantKycPendingField.IdentityDocumentType);
        if (req.IdentityDocumentNumber != null) fields.Add(MerchantKycPendingField.IdentityDocumentNumber);
        if (req.OperationType.HasValue) fields.Add(MerchantKycPendingField.OperationType);
        if (req.BusinessDescription != null) fields.Add(MerchantKycPendingField.BusinessDescription);
        if (req.Website != null) fields.Add(MerchantKycPendingField.Website);
        if (req.MonthlyRevenue.HasValue) fields.Add(MerchantKycPendingField.MonthlyRevenue);
        if (req.AverageTicket.HasValue) fields.Add(MerchantKycPendingField.AverageTicket);
        if (req.UsesPix.HasValue) fields.Add(MerchantKycPendingField.UsesPix);
        if (req.UsesBoleto.HasValue) fields.Add(MerchantKycPendingField.UsesBoleto);
        if (req.UsesCreditCard.HasValue) fields.Add(MerchantKycPendingField.UsesCreditCard);

        if (req.ProofOfAddressFileId.HasValue) fields.Add(MerchantKycPendingField.ProofOfAddressFileId);
        if (req.DocumentFrontFileId.HasValue) fields.Add(MerchantKycPendingField.DocumentFrontFileId);
        if (req.DocumentBackFileId.HasValue) fields.Add(MerchantKycPendingField.DocumentBackFileId);
        if (req.SelfieFileId.HasValue) fields.Add(MerchantKycPendingField.SelfieFileId);
        if (req.CnpjCardFileId.HasValue) fields.Add(MerchantKycPendingField.CnpjCardFileId);
        if (req.CompanyContractFileId.HasValue) fields.Add(MerchantKycPendingField.CompanyContractFileId);

        return fields;
    }
}
