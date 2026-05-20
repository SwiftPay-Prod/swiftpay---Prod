using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api_payment.Interfaces.Internal;

public interface IAcquirerConfigService
{
    Task<AcquirerConfigResult?> GetDefaultAcquirerConfigAsync(Guid merchantId, ApiEnvironment environment);
    Task<AcquirerConfigResult?> GetAcquirerConfigAsync(Guid merchantId, Guid acquirerId, ApiEnvironment environment);
    Task<AcquirerConfigResult?> GetAcquirerConfigByMerchantAcquirerIdAsync(Guid merchantId, Guid merchantAcquirerId, ApiEnvironment environment);
    Task<AcquirerConfigResult?> GetPlatformAcquirerConfigAsync(Guid acquirerId, ApiEnvironment environment);
}

public record AcquirerConfigResult
{
    public required AcquirerType AcquirerType { get; init; }
    public required AcquirerConfig Config { get; init; }
    public required Guid MerchantAcquirerId { get; init; }
    public required bool SupportsPix { get; init; }
    public required bool SupportsBoleto { get; init; }
    public required bool SupportsCreditCard { get; init; }
    public required bool SupportsWithdrawal { get; init; }
    public required bool SupportsRefund { get; init; }

    // PIX Limits
    public long MinPixAmount { get; init; } = 100;
    public long MaxPixAmount { get; init; } = 0;

    // Boleto Limits
    public long MinBoletoAmount { get; init; } = 500;
    public long MaxBoletoAmount { get; init; } = 0;

    // Credit Card Limits
    public long MinCreditCardAmount { get; init; } = 100;
    public long MaxCreditCardAmount { get; init; } = 0;

    // Payout Limits
    public long MinPayoutAmount { get; init; } = 100;
    public long MaxPayoutAmount { get; init; } = 0;
}
