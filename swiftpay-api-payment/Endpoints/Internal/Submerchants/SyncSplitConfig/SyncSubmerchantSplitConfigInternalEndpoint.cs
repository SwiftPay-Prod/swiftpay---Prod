using FastEndpoints;
using swiftpay_api_core.Interfaces;
using swiftpay_api_payment.EndpointsGroups;
using swiftpay_api_payment.Interfaces.Internal;

namespace swiftpay_api_payment.Endpoints.Internal.Submerchants.SyncSplitConfig;

public sealed class SyncSubmerchantSplitConfigInternalEndpoint(
    IAcquirerConfigService acquirerConfigService,
    IEnvironmentProvider environmentProvider,
    ISubmerchantOrchestrationService submerchantOrchestrationService
) : Endpoint<SyncSubmerchantSplitConfigInternalRequest, SyncSubmerchantSplitConfigInternalResponse>
{
    public override void Configure()
    {
        Post("split-config/sync");
        Group<InternalSubmerchantGroup>();
    }

    public override async Task HandleAsync(SyncSubmerchantSplitConfigInternalRequest req, CancellationToken ct)
    {
        var environment = environmentProvider.CurrentEnvironment;

        var configResult = await acquirerConfigService.GetPlatformAcquirerConfigAsync(req.AcquirerId, environment);
        if (configResult == null)
        {
            await Send.ResponseAsync(new SyncSubmerchantSplitConfigInternalResponse
            {
                Success = false,
                ErrorMessage = "Adquirente não encontrada ou inativa."
            }, 400, ct);
            return;
        }

        var response = await submerchantOrchestrationService.SyncSplitConfigAsync(
            configResult,
            new SubmerchantSplitConfigInput
            {
                ExternalSubmerchantId = req.ExternalSubmerchantId,
                CommissionType = req.CommissionType,
                CommissionValue = req.CommissionValue,
                IsActive = req.IsActive
            },
            ct);

        if (!response.Success)
        {
            await Send.ResponseAsync(new SyncSubmerchantSplitConfigInternalResponse
            {
                Success = false,
                ErrorMessage = response.ErrorMessage ?? "Falha ao sincronizar split config na processadora."
            }, 400, ct);
            return;
        }

        await Send.OkAsync(new SyncSubmerchantSplitConfigInternalResponse
        {
            Success = true,
            ExternalSubmerchantId = response.ExternalSubmerchantId,
            CommissionType = response.CommissionType,
            CommissionValue = response.CommissionValue,
            IsActive = response.IsActive
        }, ct);
    }
}
