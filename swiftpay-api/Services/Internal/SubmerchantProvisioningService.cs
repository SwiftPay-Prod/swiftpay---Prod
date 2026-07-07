using swiftpay_api.Interfaces;
using swiftpay_api.Models.PaymentApi;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Services.Internal;

public sealed class SubmerchantProvisioningService(
    IPaymentApiClient paymentApiClient,
    PrimaryDbContext dbContext,
    IStorageService storageService,
    ILogger<SubmerchantProvisioningService> logger
) : ISubmerchantProvisioningService
{
    private const int SubmerchantKycSignedUrlExpiryInSeconds = 31536000;

    public async Task<SubmerchantProvisioningResult> EnsureSubmerchantProvisionedAsync(
        Merchant merchant,
        MerchantAcquirer merchantAcquirer,
        Acquirer acquirer,
        bool forceResubmit = false,
        CancellationToken ct = default)
    {
        if (!ExternalSubmerchantUtils.UsesExternalSubmerchant(acquirer.ProviderCategory))
            return SubmerchantProvisioningResult.Ok();

        if (!string.IsNullOrWhiteSpace(merchantAcquirer.ExternalSubmerchantId) && !forceResubmit)
            return SubmerchantProvisioningResult.Ok();

        var kyc = merchant.MerchantKyc;
        if (kyc == null
            || string.IsNullOrWhiteSpace(kyc.LegalName)
            || !kyc.DocumentType.HasValue
            || string.IsNullOrWhiteSpace(kyc.DocumentNumber))
        {
            return SubmerchantProvisioningResult.Fail(
                "Nao foi possivel vincular a organizacao na processadora. Complete os dados de KYC (razao social, tipo e numero do documento) e tente novamente.");
        }

        if (string.IsNullOrWhiteSpace(merchant.Email))
        {
            return SubmerchantProvisioningResult.Fail(
                "Nao foi possivel vincular a organizacao na processadora. O e-mail da organizacao e obrigatorio para a subconta externa.");
        }

        var documentsResult = await BuildSubmerchantDocumentsAsync(merchant, kyc, ct);
        if (!documentsResult.Success)
            return SubmerchantProvisioningResult.Fail(documentsResult.ErrorMessage);

        var addressResult = BuildSubmerchantAddress(merchant);
        if (!addressResult.Success)
            return SubmerchantProvisioningResult.Fail(addressResult.ErrorMessage);

        var submitResult = await paymentApiClient.SubmitSubmerchantAsync(new SubmitSubmerchantApiInput
        {
            AcquirerId = acquirer.Id,
            MerchantId = merchant.Id,
            ExistingExternalSubmerchantId = string.IsNullOrWhiteSpace(merchantAcquirer.ExternalSubmerchantId)
                ? null
                : merchantAcquirer.ExternalSubmerchantId.Trim(),
            LegalName = kyc.LegalName.Trim(),
            TradeName = string.IsNullOrWhiteSpace(merchant.Name) ? kyc.LegalName.Trim() : merchant.Name.Trim(),
            DocumentType = kyc.DocumentType.Value.ToString(),
            DocumentNumber = kyc.DocumentNumber.Trim(),
            Email = merchant.Email,
            Phone = string.IsNullOrWhiteSpace(merchant.WhatsApp) ? merchant.PhoneNumber : merchant.WhatsApp,
            BusinessDescription = kyc.BusinessDescription,
            Website = kyc.Website,
            Documents = documentsResult.Documents,
            Address = addressResult.Address
        }, ct);

        var resolvedExternalSubmerchantId = !string.IsNullOrWhiteSpace(submitResult.ExternalSubmerchantId)
            ? submitResult.ExternalSubmerchantId.Trim()
            : merchantAcquirer.ExternalSubmerchantId?.Trim();

        if (!submitResult.Success || string.IsNullOrWhiteSpace(resolvedExternalSubmerchantId))
        {
            logger.LogError(
                "Failed to submit merchant as submerchant: MerchantId={MerchantId}, AcquirerId={AcquirerId}, AcquirerType={AcquirerType}, Error={Error}",
                merchant.Id,
                acquirer.Id,
                acquirer.Type,
                submitResult.ErrorMessage);

            return SubmerchantProvisioningResult.Fail(
                submitResult.ErrorMessage ?? "Falha ao criar subconta da organizacao na processadora.");
        }

        var now = DateTime.UtcNow;
        var externalStatus = ExternalSubmerchantUtils.Parse(submitResult.Status);

        merchantAcquirer.ExternalSubmerchantId = resolvedExternalSubmerchantId;
        merchantAcquirer.ExternalSubmerchantStatus = externalStatus;
        merchantAcquirer.ExternalOnboardingSubmittedAt = now;
        merchantAcquirer.ExternalOnboardingCompletedAt = ExternalSubmerchantUtils.IsTerminal(externalStatus)
            ? now
            : null;
        merchantAcquirer.ExternalOnboardingRejectionReason = externalStatus == ExternalSubmerchantStatus.Rejected
            ? submitResult.RejectionReason
            : null;
        merchantAcquirer.UpdatedAt = now;

        return SubmerchantProvisioningResult.Ok();
    }

    public async Task<SubmerchantStatusRefreshResult> RefreshSubmerchantStatusAsync(
        MerchantAcquirer merchantAcquirer,
        Acquirer acquirer,
        CancellationToken ct = default)
    {
        if (!ExternalSubmerchantUtils.UsesExternalSubmerchant(acquirer.ProviderCategory))
            return SubmerchantStatusRefreshResult.Fail("A adquirente nao exige subconta externa para este fluxo.");

        if (string.IsNullOrWhiteSpace(merchantAcquirer.ExternalSubmerchantId))
            return SubmerchantStatusRefreshResult.Fail("Subconta externa nao encontrada para este vinculo.");

        var statusResult = await paymentApiClient.GetSubmerchantStatusAsync(new GetSubmerchantStatusApiInput
        {
            AcquirerId = acquirer.Id,
            ExternalSubmerchantId = merchantAcquirer.ExternalSubmerchantId.Trim()
        }, ct);

        if (!statusResult.Success)
        {
            return SubmerchantStatusRefreshResult.Fail(
                statusResult.ErrorMessage ?? "Falha ao consultar subconta da organizacao na processadora.");
        }

        var now = DateTime.UtcNow;
        var parsedStatus = ExternalSubmerchantUtils.Parse(statusResult.Status);

        merchantAcquirer.ExternalSubmerchantStatus = parsedStatus;
        merchantAcquirer.ExternalOnboardingSubmittedAt ??= now;
        merchantAcquirer.ExternalOnboardingCompletedAt = ExternalSubmerchantUtils.IsTerminal(parsedStatus)
            ? now
            : null;
        merchantAcquirer.ExternalOnboardingRejectionReason = parsedStatus == ExternalSubmerchantStatus.Rejected
            ? statusResult.RejectionReason
            : null;
        merchantAcquirer.UpdatedAt = now;

        return new SubmerchantStatusRefreshResult
        {
            Success = true,
            MerchantAcquirerId = merchantAcquirer.Id,
            ExternalSubmerchantId = merchantAcquirer.ExternalSubmerchantId,
            Status = parsedStatus,
            LegalName = statusResult.LegalName,
            DocumentType = statusResult.DocumentType,
            DocumentNumber = statusResult.DocumentNumber,
            CreatedAt = statusResult.CreatedAt,
            UpdatedAt = statusResult.UpdatedAt,
            RejectionReason = statusResult.RejectionReason
        };
    }

    private async Task<(bool Success, string? ErrorMessage, List<SubmitSubmerchantDocumentApiInput> Documents)> BuildSubmerchantDocumentsAsync(
        Merchant merchant,
        MerchantKyc kyc,
        CancellationToken ct)
    {
        var requiredDocuments = ResolveRequiredDocumentMappings(kyc);
        if (requiredDocuments.Count == 0)
        {
            return (false, "Nao foi possivel vincular a organizacao na processadora. Nenhum documento de KYC foi encontrado para envio.", []);
        }

        var requiredFileIds = requiredDocuments
            .Select(doc => doc.FileId)
            .Distinct()
            .ToList();

        var filesById = await dbContext.StoredFiles
            .Where(file => requiredFileIds.Contains(file.Id))
            .ToDictionaryAsync(file => file.Id, ct);

        var documentPayloads = new List<SubmitSubmerchantDocumentApiInput>(requiredDocuments.Count);

        foreach (var requiredDocument in requiredDocuments)
        {
            if (!filesById.TryGetValue(requiredDocument.FileId, out var file))
            {
                return (false, $"Nao foi possivel vincular a organizacao na processadora. Documento obrigatorio ausente: {requiredDocument.Type}.", []);
            }

            var fileUrl = await storageService.GetOrRefreshUrlAsync(file, SubmerchantKycSignedUrlExpiryInSeconds);
            if (string.IsNullOrWhiteSpace(fileUrl))
            {
                return (false, $"Nao foi possivel gerar URL para o documento {requiredDocument.Type}.", []);
            }

            documentPayloads.Add(new SubmitSubmerchantDocumentApiInput
            {
                Type = requiredDocument.Type,
                Number = requiredDocument.Number,
                FileUrl = fileUrl,
                FileName = string.IsNullOrWhiteSpace(file.OriginalFileName)
                    ? $"{requiredDocument.Type.ToLowerInvariant()}.bin"
                    : file.OriginalFileName,
                FileSize = file.Size,
                MimeType = file.ContentType,
                ExpiresAt = file.CachedUrlExpiresAt?.ToUniversalTime().ToString("O")
            });
        }

        return (true, null, documentPayloads);
    }

    private static (bool Success, string? ErrorMessage, SubmitSubmerchantAddressApiInput? Address) BuildSubmerchantAddress(Merchant merchant)
    {
        if (string.IsNullOrWhiteSpace(merchant.Address)
            || string.IsNullOrWhiteSpace(merchant.AddressNumber)
            || string.IsNullOrWhiteSpace(merchant.Neighborhood)
            || string.IsNullOrWhiteSpace(merchant.City)
            || string.IsNullOrWhiteSpace(merchant.State)
            || string.IsNullOrWhiteSpace(merchant.PostalCode))
        {
            return (false,
                "Nao foi possivel vincular a organizacao na processadora. Complete o endereco da organizacao para reenviar a subconta externa.",
                null);
        }

        return (true, null, new SubmitSubmerchantAddressApiInput
        {
            Street = merchant.Address.Trim(),
            Number = merchant.AddressNumber.Trim(),
            Complement = string.IsNullOrWhiteSpace(merchant.AddressComplement) ? null : merchant.AddressComplement.Trim(),
            Neighborhood = merchant.Neighborhood.Trim(),
            City = merchant.City.Trim(),
            State = merchant.State.Trim().ToUpperInvariant(),
            ZipCode = NormalizePostalCode(merchant.PostalCode)
        });
    }

    private static List<(string Type, Guid FileId, string? Number)> ResolveRequiredDocumentMappings(MerchantKyc kyc)
    {
        var documents = new List<(string Type, Guid FileId, string? Number)>();

        if (kyc.DocumentType == MerchantKycDocumentType.CNPJ)
        {
            if (kyc.CompanyContractFileId.HasValue)
                documents.Add(("SOCIAL_CONTRACT", kyc.CompanyContractFileId.Value, null));

            if (kyc.CnpjCardFileId.HasValue)
                documents.Add(("CNPJ_CARD", kyc.CnpjCardFileId.Value, null));
        }

        if (kyc.DocumentFrontFileId.HasValue)
            documents.Add(("FRONT_ID_DOC", kyc.DocumentFrontFileId.Value, kyc.IdentityDocumentNumber));

        if (kyc.DocumentBackFileId.HasValue)
            documents.Add(("BACK_ID_DOC", kyc.DocumentBackFileId.Value, kyc.IdentityDocumentNumber));

        if (kyc.SelfieFileId.HasValue)
            documents.Add(("SELFIE_PHOTO", kyc.SelfieFileId.Value, null));

        return documents;
    }

    private static string NormalizePostalCode(string? postalCode)
        => new((postalCode ?? string.Empty).Where(char.IsDigit).ToArray());

}
