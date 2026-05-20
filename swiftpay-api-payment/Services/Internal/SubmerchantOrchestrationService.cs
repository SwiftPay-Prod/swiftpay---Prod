using safefy_api_core.Models.Database;
using safefy_api_payment.Interfaces.Internal;
using safefy_api_payment.Interfaces.Internal.Submerchants;

namespace safefy_api_payment.Services.Internal;

public sealed class SubmerchantOrchestrationService(
    ISubmerchantProviderAdapterFactory submerchantProviderAdapterFactory
) : ISubmerchantOrchestrationService
{
    public async Task<SubmerchantSubmitResult> SubmitAsync(
        AcquirerConfigResult acquirerConfig,
        SubmerchantSubmitInput input,
        CancellationToken ct = default)
    {
        var operations = submerchantProviderAdapterFactory.GetOperations(acquirerConfig);
        if (!operations.SupportsSubmit)
            return FailSubmitUnsupported(acquirerConfig.AcquirerType);

        var adapter = submerchantProviderAdapterFactory.GetAdapter(acquirerConfig);
        if (adapter == null)
            return FailSubmitUnsupported(acquirerConfig.AcquirerType);

        return await adapter.SubmitAsync(acquirerConfig, input, ct);
    }

    public async Task<SubmerchantStatusResult> GetStatusAsync(
        AcquirerConfigResult acquirerConfig,
        string externalSubmerchantId,
        CancellationToken ct = default)
    {
        var operations = submerchantProviderAdapterFactory.GetOperations(acquirerConfig);
        if (!operations.SupportsStatusSync)
            return FailStatusUnsupported(acquirerConfig.AcquirerType);

        var adapter = submerchantProviderAdapterFactory.GetAdapter(acquirerConfig);
        if (adapter == null)
            return FailStatusUnsupported(acquirerConfig.AcquirerType);

        return await adapter.GetStatusAsync(acquirerConfig, externalSubmerchantId, ct);
    }

    public async Task<SubmerchantSplitConfigResult> SyncSplitConfigAsync(
        AcquirerConfigResult acquirerConfig,
        SubmerchantSplitConfigInput input,
        CancellationToken ct = default)
    {
        var operations = submerchantProviderAdapterFactory.GetOperations(acquirerConfig);
        if (!operations.SupportsSplitConfigSync)
            return FailSplitUnsupported(acquirerConfig.AcquirerType);

        var adapter = submerchantProviderAdapterFactory.GetAdapter(acquirerConfig);
        if (adapter == null)
            return FailSplitUnsupported(acquirerConfig.AcquirerType);

        return await adapter.SyncSplitConfigAsync(acquirerConfig, input, ct);
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
}
