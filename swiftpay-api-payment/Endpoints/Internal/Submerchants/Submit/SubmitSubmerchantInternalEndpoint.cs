using FastEndpoints;
using swiftpay_api_core.Interfaces;
using swiftpay_api_payment.EndpointsGroups;
using swiftpay_api_payment.Interfaces.Internal;

namespace swiftpay_api_payment.Endpoints.Internal.Submerchants.Submit;

public sealed class SubmitSubmerchantInternalEndpoint(
    IAcquirerConfigService acquirerConfigService,
    IEnvironmentProvider environmentProvider,
    ISubmerchantOrchestrationService submerchantOrchestrationService
) : Endpoint<SubmitSubmerchantInternalRequest, SubmitSubmerchantInternalResponse>
{
    public override void Configure()
    {
        Post("");
        Group<InternalSubmerchantGroup>();
    }

    public override async Task HandleAsync(SubmitSubmerchantInternalRequest req, CancellationToken ct)
    {
        var environment = environmentProvider.CurrentEnvironment;

        var configResult = await acquirerConfigService.GetPlatformAcquirerConfigAsync(req.AcquirerId, environment);
        if (configResult == null)
        {
            await Send.ResponseAsync(new SubmitSubmerchantInternalResponse
            {
                Success = false,
                ErrorMessage = "Adquirente não encontrada ou inativa."
            }, 400, ct);
            return;
        }

        var response = await submerchantOrchestrationService.SubmitAsync(
            configResult,
            new SubmerchantSubmitInput
            {
                ExistingExternalSubmerchantId = req.ExistingExternalSubmerchantId,
                LegalName = req.LegalName,
                TradeName = req.TradeName,
                DocumentType = req.DocumentType,
                DocumentNumber = req.DocumentNumber,
                Email = req.Email,
                Phone = req.Phone,
                BusinessDescription = req.BusinessDescription,
                Website = req.Website,
                Documents = req.Documents.Select(document => new SubmerchantDocumentInput
                {
                    Type = document.Type,
                    Number = document.Number,
                    FileUrl = document.FileUrl,
                    FileName = document.FileName,
                    FileSize = document.FileSize,
                    MimeType = document.MimeType,
                    ExpiresAt = document.ExpiresAt
                }).ToList(),
                Address = req.Address != null
                    ? new SubmerchantAddressInput
                    {
                        Street = req.Address.Street,
                        Number = req.Address.Number,
                        Complement = req.Address.Complement,
                        Neighborhood = req.Address.Neighborhood,
                        City = req.Address.City,
                        State = req.Address.State,
                        ZipCode = req.Address.ZipCode
                    }
                    : null,
                BankAccount = req.BankAccount != null
                    ? new SubmerchantBankAccountInput
                    {
                        BankCode = req.BankAccount.BankCode,
                        Branch = req.BankAccount.Branch,
                        AccountNumber = req.BankAccount.AccountNumber,
                        AccountType = req.BankAccount.AccountType
                    }
                    : null
            },
            ct);

        if (!response.Success)
        {
            await Send.ResponseAsync(new SubmitSubmerchantInternalResponse
            {
                Success = false,
                ErrorMessage = response.ErrorMessage ?? "Falha ao criar submerchant na processadora."
            }, 400, ct);
            return;
        }

        await Send.ResponseAsync(new SubmitSubmerchantInternalResponse
        {
            Success = true,
            ExternalSubmerchantId = response.ExternalSubmerchantId,
            Status = response.Status,
            RejectionReason = response.RejectionReason
        }, 200, ct);
    }
}
