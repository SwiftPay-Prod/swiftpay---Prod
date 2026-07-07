using swiftpay_api_core.Models.Database;

namespace swiftpay_api_payment.Interfaces.Internal.Submerchants;

public interface ISubmerchantProviderPolicyService
{
    SubmerchantProviderCapabilities GetCapabilities(MerchantAcquirer merchantAcquirer);

    SubmerchantRoutingReadiness EvaluateRoutingReadiness(MerchantAcquirer merchantAcquirer);
}

public sealed class SubmerchantProviderCapabilities
{
    public bool UsesExternalSubmerchant { get; set; }
    public bool SupportsLifecycle { get; set; }
    public bool SupportsSubmit { get; set; }
    public bool SupportsStatusSync { get; set; }
    public bool SupportsSplitConfigSync { get; set; }
}

public sealed class SubmerchantRoutingReadiness
{
    public const string ReadyCode = "ready";
    public const string NotRequiredCode = "not_required";
    public const string MissingExternalSubmerchantIdCode = "missing_external_submerchant_id";
    public const string ExternalSubmerchantNotOperationalCode = "external_submerchant_not_operational";

    public bool IsReady { get; set; }
    public string Code { get; set; } = ReadyCode;
    public string Message { get; set; } = "Subconta pronta para roteamento.";
    public ExternalSubmerchantStatus? CurrentStatus { get; set; }

    public static SubmerchantRoutingReadiness Ready(ExternalSubmerchantStatus? status = null)
        => new()
        {
            IsReady = true,
            Code = ReadyCode,
            Message = "Subconta pronta para roteamento.",
            CurrentStatus = status
        };

    public static SubmerchantRoutingReadiness NotRequired()
        => new()
        {
            IsReady = true,
            Code = NotRequiredCode,
            Message = "A adquirente nao exige subconta externa para roteamento."
        };

    public static SubmerchantRoutingReadiness MissingExternalSubmerchantId(ExternalSubmerchantStatus status)
        => new()
        {
            IsReady = false,
            Code = MissingExternalSubmerchantIdCode,
            Message = "A subconta externa ainda nao foi vinculada.",
            CurrentStatus = status
        };

    public static SubmerchantRoutingReadiness ExternalSubmerchantNotOperational(ExternalSubmerchantStatus status)
        => new()
        {
            IsReady = false,
            Code = ExternalSubmerchantNotOperationalCode,
            Message = $"A subconta externa nao esta operacional. Status atual: {status}.",
            CurrentStatus = status
        };
}