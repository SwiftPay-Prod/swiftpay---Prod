using safefy_api_core.Models.Database;
using safefy_api_payment.Interfaces.Internal;

namespace safefy_api_payment.Interfaces.Internal.Submerchants;

public interface ISubmerchantProviderAdapter
{
    AcquirerType AcquirerType { get; }

    SubmerchantProviderOperations Operations { get; }

    bool Supports(AcquirerConfigResult acquirerConfig);

    Task<SubmerchantSubmitResult> SubmitAsync(
        AcquirerConfigResult acquirerConfig,
        SubmerchantSubmitInput input,
        CancellationToken ct = default);

    Task<SubmerchantStatusResult> GetStatusAsync(
        AcquirerConfigResult acquirerConfig,
        string externalSubmerchantId,
        CancellationToken ct = default);

    Task<SubmerchantSplitConfigResult> SyncSplitConfigAsync(
        AcquirerConfigResult acquirerConfig,
        SubmerchantSplitConfigInput input,
        CancellationToken ct = default);
}