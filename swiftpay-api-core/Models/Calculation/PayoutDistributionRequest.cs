namespace swiftpay_api_core.Models.Calculation;

public sealed record PayoutDistributionRequest(
    Guid AcquirerId,
    long Amount);
