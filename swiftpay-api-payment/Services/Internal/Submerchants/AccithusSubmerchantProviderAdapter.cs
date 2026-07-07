using System.Linq;
using swiftpay_api_core.Models.Database;
using swiftpay_api_payment.Clients.Accithus;
using swiftpay_api_payment.Clients.Accithus.Models.Submerchant;
using swiftpay_api_payment.Interfaces.Acquirers;
using swiftpay_api_payment.Interfaces.Internal;
using swiftpay_api_payment.Interfaces.Internal.Submerchants;

namespace swiftpay_api_payment.Services.Internal.Submerchants;

public sealed class AccithusSubmerchantProviderAdapter(
    IAccithusClient accithusClient,
    ILogger<AccithusSubmerchantProviderAdapter> logger
) : ISubmerchantProviderAdapter
{
    private static readonly SubmerchantProviderOperations SupportedOperations = SubmerchantProviderOperations.Full();

    public AcquirerType AcquirerType => AcquirerType.Accithus;

    public SubmerchantProviderOperations Operations => SupportedOperations;

    public bool Supports(AcquirerConfigResult acquirerConfig)
        => acquirerConfig.AcquirerType == AcquirerType.Accithus;

    public async Task<SubmerchantSubmitResult> SubmitAsync(
        AcquirerConfigResult acquirerConfig,
        SubmerchantSubmitInput input,
        CancellationToken ct = default)
    {
        if (!Supports(acquirerConfig))
            return FailSubmitUnsupported(acquirerConfig.AcquirerType);

        if (string.IsNullOrWhiteSpace(input.Email))
        {
            return new SubmerchantSubmitResult
            {
                Success = false,
                ErrorMessage = "Email obrigatorio para criar submerchant na Accithus."
            };
        }

        var taxId = NormalizeTaxId(input.DocumentNumber);
        if (string.IsNullOrWhiteSpace(taxId))
        {
            return new SubmerchantSubmitResult
            {
                Success = false,
                ErrorMessage = "Documento (CPF/CNPJ) obrigatorio para criar submerchant na Accithus."
            };
        }

        var authHeader = AccithusClient.BuildAuthHeader(
            acquirerConfig.Config.GetRequiredCredential("publicKey"),
            acquirerConfig.Config.GetRequiredCredential("secretKey"));

        var existingExternalSubmerchantId = input.ExistingExternalSubmerchantId?.Trim();
        var hasExistingSubmerchant = !string.IsNullOrWhiteSpace(existingExternalSubmerchantId);

        string? externalSubmerchantId = null;
        string? currentStatus = null;
        string? rejectionReason = null;

        if (hasExistingSubmerchant)
        {
            externalSubmerchantId = existingExternalSubmerchantId;

            var updateResponse = await accithusClient.UpdateSubmerchantAsync(
                acquirerConfig.Config.ApiBaseUrl,
                authHeader,
                externalSubmerchantId!,
                BuildUpdateRequest(input));

            if (!updateResponse.Success)
            {
                logger.LogError(
                    "Failed to update submerchant: AcquirerId={AcquirerId}, AcquirerType={AcquirerType}, SubmerchantId={SubmerchantId}, Error={Error}",
                    acquirerConfig.Config.AcquirerId,
                    acquirerConfig.AcquirerType,
                    externalSubmerchantId,
                    updateResponse.ErrorMessage);

                return new SubmerchantSubmitResult
                {
                    Success = false,
                    ErrorMessage = updateResponse.ErrorMessage ?? "Falha ao atualizar submerchant na processadora."
                };
            }

            currentStatus = updateResponse.Data?.Status;
            rejectionReason = updateResponse.Data != null ? ResolveRejectionReason(updateResponse.Data) : null;
        }
        else
        {
            var createResponse = await accithusClient.CreateSubmerchantAsync(
                acquirerConfig.Config.ApiBaseUrl,
                authHeader,
                BuildCreateRequest(input, taxId));

            if (!createResponse.Success || createResponse.Data == null || string.IsNullOrWhiteSpace(createResponse.Data.Id))
            {
                logger.LogError(
                    "Failed to create submerchant: AcquirerId={AcquirerId}, AcquirerType={AcquirerType}, Error={Error}",
                    acquirerConfig.Config.AcquirerId,
                    acquirerConfig.AcquirerType,
                    createResponse.ErrorMessage);

                return new SubmerchantSubmitResult
                {
                    Success = false,
                    ErrorMessage = createResponse.ErrorMessage ?? "Falha ao criar submerchant na processadora."
                };
            }

            externalSubmerchantId = createResponse.Data.Id!.Trim();
            currentStatus = createResponse.Data.Status;
            rejectionReason = ResolveRejectionReason(createResponse.Data);
        }

        var uploadDocumentsResult = await UploadDocumentsAsync(acquirerConfig, authHeader, externalSubmerchantId!, input.Documents);
        if (!uploadDocumentsResult.Success)
        {
            return uploadDocumentsResult;
        }

        var uploadAddressResult = await UploadAddressAsync(acquirerConfig, authHeader, externalSubmerchantId!, input.Address);
        if (!uploadAddressResult.Success)
        {
            return uploadAddressResult;
        }

        if (IsRejectedStatus(currentStatus))
        {
            var resubmitResponse = await accithusClient.ResubmitSubmerchantAsync(
                acquirerConfig.Config.ApiBaseUrl,
                authHeader,
                externalSubmerchantId!,
                BuildResubmitRequest(input));

            if (!resubmitResponse.Success)
            {
                logger.LogError(
                    "Failed to resubmit submerchant: AcquirerId={AcquirerId}, AcquirerType={AcquirerType}, SubmerchantId={SubmerchantId}, Error={Error}",
                    acquirerConfig.Config.AcquirerId,
                    acquirerConfig.AcquirerType,
                    externalSubmerchantId,
                    resubmitResponse.ErrorMessage);

                return new SubmerchantSubmitResult
                {
                    Success = false,
                    ErrorMessage = resubmitResponse.ErrorMessage ?? "Falha ao reenviar submerchant para analise na processadora."
                };
            }

            currentStatus = resubmitResponse.Data?.Status ?? currentStatus;
            rejectionReason = resubmitResponse.Data != null ? ResolveRejectionReason(resubmitResponse.Data) : rejectionReason;
        }

        var statusResponse = await accithusClient.GetSubmerchantAsync(
            acquirerConfig.Config.ApiBaseUrl,
            authHeader,
            externalSubmerchantId!);

        if (statusResponse.Success && statusResponse.Data != null)
        {
            currentStatus = statusResponse.Data.Status;
            rejectionReason = ResolveRejectionReason(statusResponse.Data);
        }

        return new SubmerchantSubmitResult
        {
            Success = true,
            ExternalSubmerchantId = externalSubmerchantId,
            Status = currentStatus,
            RejectionReason = rejectionReason
        };
    }

    public async Task<SubmerchantStatusResult> GetStatusAsync(
        AcquirerConfigResult acquirerConfig,
        string externalSubmerchantId,
        CancellationToken ct = default)
    {
        if (!Supports(acquirerConfig))
            return FailStatusUnsupported(acquirerConfig.AcquirerType);

        var authHeader = AccithusClient.BuildAuthHeader(
            acquirerConfig.Config.GetRequiredCredential("publicKey"),
            acquirerConfig.Config.GetRequiredCredential("secretKey"));

        var response = await accithusClient.GetSubmerchantAsync(
            acquirerConfig.Config.ApiBaseUrl,
            authHeader,
            externalSubmerchantId);

        if (!response.Success || response.Data == null)
        {
            logger.LogError(
                "Failed to get submerchant status: AcquirerId={AcquirerId}, AcquirerType={AcquirerType}, SubmerchantId={SubmerchantId}, Error={Error}",
                acquirerConfig.Config.AcquirerId,
                acquirerConfig.AcquirerType,
                externalSubmerchantId,
                response.ErrorMessage);

            return new SubmerchantStatusResult
            {
                Success = false,
                ErrorMessage = response.ErrorMessage ?? "Falha ao consultar submerchant na processadora."
            };
        }

        return new SubmerchantStatusResult
        {
            Success = true,
            ExternalSubmerchantId = response.Data.Id,
            Status = response.Data.Status,
            LegalName = response.Data.LegalName,
            DocumentType = response.Data.DocumentType,
            DocumentNumber = response.Data.DocumentNumber,
            CreatedAt = response.Data.CreatedAt,
            UpdatedAt = response.Data.UpdatedAt,
            RejectionReason = ResolveRejectionReason(response.Data)
        };
    }

    public async Task<SubmerchantSplitConfigResult> SyncSplitConfigAsync(
        AcquirerConfigResult acquirerConfig,
        SubmerchantSplitConfigInput input,
        CancellationToken ct = default)
    {
        if (!Supports(acquirerConfig))
            return FailSplitUnsupported(acquirerConfig.AcquirerType);

        var authHeader = AccithusClient.BuildAuthHeader(
            acquirerConfig.Config.GetRequiredCredential("publicKey"),
            acquirerConfig.Config.GetRequiredCredential("secretKey"));

        var splitRequest = new AccithusUpsertSubmerchantSplitConfigRequest
        {
            CommissionType = input.CommissionType.ToLowerInvariant(),
            CommissionValue = input.CommissionValue,
            IsActive = input.IsActive
        };

        var updateResponse = await accithusClient.UpdateSubmerchantSplitConfigAsync(
            acquirerConfig.Config.ApiBaseUrl,
            authHeader,
            input.ExternalSubmerchantId,
            splitRequest);

        if (!updateResponse.Success)
        {
            var createResponse = await accithusClient.CreateSubmerchantSplitConfigAsync(
                acquirerConfig.Config.ApiBaseUrl,
                authHeader,
                input.ExternalSubmerchantId,
                splitRequest);

            if (!createResponse.Success || createResponse.Data == null)
            {
                logger.LogError(
                    "Failed to sync split config: AcquirerId={AcquirerId}, AcquirerType={AcquirerType}, SubmerchantId={SubmerchantId}, Error={Error}",
                    acquirerConfig.Config.AcquirerId,
                    acquirerConfig.AcquirerType,
                    input.ExternalSubmerchantId,
                    createResponse.ErrorMessage ?? updateResponse.ErrorMessage);

                return new SubmerchantSplitConfigResult
                {
                    Success = false,
                    ErrorMessage = createResponse.ErrorMessage ?? updateResponse.ErrorMessage ?? "Falha ao sincronizar split config na processadora."
                };
            }

            return new SubmerchantSplitConfigResult
            {
                Success = true,
                ExternalSubmerchantId = createResponse.Data.SubmerchantId,
                CommissionType = createResponse.Data.CommissionType,
                CommissionValue = createResponse.Data.CommissionValue,
                IsActive = createResponse.Data.IsActive
            };
        }

        var resultData = updateResponse.Data;

        return new SubmerchantSplitConfigResult
        {
            Success = true,
            ExternalSubmerchantId = resultData?.SubmerchantId ?? input.ExternalSubmerchantId,
            CommissionType = resultData?.CommissionType ?? splitRequest.CommissionType,
            CommissionValue = resultData?.CommissionValue ?? splitRequest.CommissionValue,
            IsActive = resultData?.IsActive ?? splitRequest.IsActive
        };
    }

    private static SubmerchantSubmitResult FailSubmitUnsupported(AcquirerType acquirerType)
        => new()
        {
            Success = false,
            ErrorMessage = $"Operacao de submerchant nao suportada para a adquirente {acquirerType}."
        };

    private static SubmerchantStatusResult FailStatusUnsupported(AcquirerType acquirerType)
        => new()
        {
            Success = false,
            ErrorMessage = $"Operacao de submerchant nao suportada para a adquirente {acquirerType}."
        };

    private static SubmerchantSplitConfigResult FailSplitUnsupported(AcquirerType acquirerType)
        => new()
        {
            Success = false,
            ErrorMessage = $"Operacao de split de submerchant nao suportada para a adquirente {acquirerType}."
        };

    private static string ResolveEntityType(string? documentType)
        => string.Equals(documentType?.Trim(), "CPF", StringComparison.OrdinalIgnoreCase) ? "pf" : "pj";

    private static string NormalizeTaxId(string? documentNumber)
        => new((documentNumber ?? string.Empty).Where(char.IsDigit).ToArray());

    private static bool IsRejectedStatus(string? status)
        => string.Equals(status?.Trim(), "rejected", StringComparison.OrdinalIgnoreCase);

    private static string? ResolveRejectionReason(AccithusSubmerchantResponse response)
        => string.IsNullOrWhiteSpace(response.RejectionReason)
            ? response.StatusReason
            : response.RejectionReason;

    private static string NormalizeZipCode(string? zipCode)
        => new((zipCode ?? string.Empty).Where(char.IsDigit).ToArray());

    private static bool HasAddressData(SubmerchantAddressInput? address)
        => address != null
            && !string.IsNullOrWhiteSpace(address.Street)
            && !string.IsNullOrWhiteSpace(address.Number)
            && !string.IsNullOrWhiteSpace(address.Neighborhood)
            && !string.IsNullOrWhiteSpace(address.City)
            && !string.IsNullOrWhiteSpace(address.State)
            && !string.IsNullOrWhiteSpace(address.ZipCode);

    private static AccithusCreateSubmerchantRequest BuildCreateRequest(SubmerchantSubmitInput input, string taxId)
        => new()
        {
            LegalName = input.LegalName,
            TradeName = string.IsNullOrWhiteSpace(input.TradeName) ? input.LegalName : input.TradeName,
            EntityType = ResolveEntityType(input.DocumentType),
            TaxId = taxId,
            Email = input.Email,
            Phone = input.Phone,
            Description = input.BusinessDescription,
            Website = input.Website,
            Address = null,
            BankAccount = null
        };

    private static AccithusUpdateSubmerchantRequest BuildUpdateRequest(SubmerchantSubmitInput input)
        => new()
        {
            LegalName = input.LegalName,
            TradeName = string.IsNullOrWhiteSpace(input.TradeName) ? input.LegalName : input.TradeName,
            Email = input.Email,
            Phone = input.Phone,
            Description = input.BusinessDescription,
            Website = input.Website
        };

    private static AccithusResubmitSubmerchantRequest BuildResubmitRequest(SubmerchantSubmitInput input)
        => new()
        {
            LegalName = input.LegalName,
            TradeName = string.IsNullOrWhiteSpace(input.TradeName) ? input.LegalName : input.TradeName,
            Email = input.Email,
            Phone = input.Phone,
            Website = input.Website,
            Description = input.BusinessDescription
        };

    private async Task<SubmerchantSubmitResult> UploadDocumentsAsync(
        AcquirerConfigResult acquirerConfig,
        string authHeader,
        string externalSubmerchantId,
        IReadOnlyList<SubmerchantDocumentInput> documents)
    {
        foreach (var document in documents)
        {
            var response = await accithusClient.AddSubmerchantDocumentAsync(
                acquirerConfig.Config.ApiBaseUrl,
                authHeader,
                externalSubmerchantId,
                new AccithusCreateSubmerchantDocumentRequest
                {
                    Type = document.Type,
                    Number = document.Number,
                    FileUrl = document.FileUrl,
                    FileName = document.FileName,
                    FileSize = document.FileSize,
                    MimeType = document.MimeType,
                    ExpiresAt = document.ExpiresAt
                });

            if (!response.Success)
            {
                logger.LogError(
                    "Failed to upload submerchant document: AcquirerId={AcquirerId}, AcquirerType={AcquirerType}, SubmerchantId={SubmerchantId}, DocumentType={DocumentType}, Error={Error}",
                    acquirerConfig.Config.AcquirerId,
                    acquirerConfig.AcquirerType,
                    externalSubmerchantId,
                    document.Type,
                    response.ErrorMessage);

                return new SubmerchantSubmitResult
                {
                    Success = false,
                    ErrorMessage = response.ErrorMessage ?? $"Falha ao enviar documento {document.Type} para a processadora."
                };
            }
        }

        return new SubmerchantSubmitResult { Success = true };
    }

    private async Task<SubmerchantSubmitResult> UploadAddressAsync(
        AcquirerConfigResult acquirerConfig,
        string authHeader,
        string externalSubmerchantId,
        SubmerchantAddressInput? address)
    {
        if (!HasAddressData(address))
        {
            return new SubmerchantSubmitResult { Success = true };
        }

        var response = await accithusClient.AddSubmerchantAddressAsync(
            acquirerConfig.Config.ApiBaseUrl,
            authHeader,
            externalSubmerchantId,
            new AccithusCreateSubmerchantAddressRequest
            {
                Type = "both",
                Street = address!.Street!.Trim(),
                Number = address.Number!.Trim(),
                Complement = string.IsNullOrWhiteSpace(address.Complement) ? null : address.Complement.Trim(),
                Neighborhood = address.Neighborhood!.Trim(),
                City = address.City!.Trim(),
                State = address.State!.Trim().ToUpperInvariant(),
                ZipCode = NormalizeZipCode(address.ZipCode),
                Country = "BR",
                IsPrimary = true
            });

        if (!response.Success)
        {
            logger.LogError(
                "Failed to upload submerchant address: AcquirerId={AcquirerId}, AcquirerType={AcquirerType}, SubmerchantId={SubmerchantId}, Error={Error}",
                acquirerConfig.Config.AcquirerId,
                acquirerConfig.AcquirerType,
                externalSubmerchantId,
                response.ErrorMessage);

            return new SubmerchantSubmitResult
            {
                Success = false,
                ErrorMessage = response.ErrorMessage ?? "Falha ao enviar endereco do submerchant para a processadora."
            };
        }

        return new SubmerchantSubmitResult { Success = true };
    }
}