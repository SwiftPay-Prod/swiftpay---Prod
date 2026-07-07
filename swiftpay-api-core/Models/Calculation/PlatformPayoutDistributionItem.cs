using AcquirerEntity = swiftpay_api_core.Models.Database.Acquirer;

namespace swiftpay_api_core.Models.Calculation;

public sealed record PlatformPayoutDistributionItem(
    AcquirerEntity Acquirer,
    long Amount,
    long Fee,
    long Net);
