using FastEndpoints;
using safefy_api_core.Interfaces;
using safefy_api_payment.EndpointsGroups;
using safefy_api_payment.Interfaces.Internal;

namespace safefy_api_payment.Endpoints.Internal.Submerchants.GetStatus;

public sealed class GetSubmerchantStatusInternalEndpoint(
    IAcquirerConfigService acquirerConfigService,
    IEnvironmentProvider environmentProvider,
    ISubmerchantOrchestrationService submerchantOrchestrationService
) : Endpoint<GetSubmerchantStatusInternalRequest, GetSubmerchantStatusInternalResponse>
{
    public override void Configure()
    {
        Post("status");
        Group<InternalSubmerchantGroup>();
    }

    public override async Task HandleAsync(GetSubmerchantStatusInternalRequest req, CancellationToken ct)
    {
        var environment = environmentProvider.CurrentEnvironment;

        var configResult = await acquirerConfigService.GetPlatformAcquirerConfigAsync(req.AcquirerId, environment);
        if (configResult == null)
        {
            await Send.ResponseAsync(new GetSubmerchantStatusInternalResponse
            {
                Success = false,
                ErrorMessage = "Adquirente não encontrada ou inativa."
            }, 400, ct);
            return;
        }

        var response = await submerchantOrchestrationService.GetStatusAsync(
            configResult,
            req.ExternalSubmerchantId,
            ct);

        if (!response.Success)
        {
            await Send.ResponseAsync(new GetSubmerchantStatusInternalResponse
            {
                Success = false,
                ErrorMessage = response.ErrorMessage ?? "Falha ao consultar submerchant na processadora."
            }, 400, ct);
            return;
        }

        await Send.ResponseAsync(new GetSubmerchantStatusInternalResponse
        {
            Success = true,
            ExternalSubmerchantId = response.ExternalSubmerchantId,
            Status = response.Status,
            LegalName = response.LegalName,
            DocumentType = response.DocumentType,
            DocumentNumber = response.DocumentNumber,
            CreatedAt = response.CreatedAt,
            UpdatedAt = response.UpdatedAt,
            RejectionReason = response.RejectionReason
        }, 200, ct);
    }
}
