namespace safefy_api_payment.Interfaces.Internal.Submerchants;

public sealed class SubmerchantProviderOperations
{
    public bool SupportsSubmit { get; init; }
    public bool SupportsStatusSync { get; init; }
    public bool SupportsSplitConfigSync { get; init; }

    public bool SupportsLifecycle
        => SupportsSubmit || SupportsStatusSync || SupportsSplitConfigSync;

    public static SubmerchantProviderOperations None()
        => new();

    public static SubmerchantProviderOperations Full()
        => new()
        {
            SupportsSubmit = true,
            SupportsStatusSync = true,
            SupportsSplitConfigSync = true
        };
}