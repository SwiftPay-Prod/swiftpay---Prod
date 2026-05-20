using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_payment.Interfaces.Internal.Submerchants;

namespace safefy_api_payment.Interfaces.Internal;

public interface ISubmerchantValidationService
{
    SubmerchantValidationResult ValidateForPayment(MerchantAcquirer merchantAcquirer, PaymentMethod method);

    SubmerchantRoutingReadiness GetRoutingReadiness(MerchantAcquirer merchantAcquirer);

    bool IsReadyForRouting(MerchantAcquirer merchantAcquirer);
}

public sealed class SubmerchantValidationResult
{
    public bool IsValid { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
    public int StatusCode { get; set; }

    public static SubmerchantValidationResult Valid()
        => new() { IsValid = true, StatusCode = 200 };

    public static SubmerchantValidationResult Invalid(string message, string errorCode, int statusCode = 400)
        => new()
        {
            IsValid = false,
            ErrorMessage = message,
            ErrorCode = errorCode,
            StatusCode = statusCode
        };
}
