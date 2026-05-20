using safefy_api_core.Constants;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_payment.Interfaces.Internal;
using safefy_api_payment.Interfaces.Internal.Submerchants;

namespace safefy_api_payment.Services.Internal;

public sealed class SubmerchantValidationService(
    ISubmerchantProviderPolicyService submerchantProviderPolicyService
) : ISubmerchantValidationService
{
    public SubmerchantValidationResult ValidateForPayment(MerchantAcquirer merchantAcquirer, PaymentMethod method)
    {
        var readiness = GetRoutingReadiness(merchantAcquirer);
        if (readiness.IsReady)
            return SubmerchantValidationResult.Valid();

        if (readiness.Code == SubmerchantRoutingReadiness.MissingExternalSubmerchantIdCode)
        {
            return SubmerchantValidationResult.Invalid(
                $"A subconta da organizacao na processadora ainda nao foi criada para operar com {ResolveMethodLabel(method)}.",
                PaymentApiErrorCodes.ExternalSubmerchantNotActive);
        }

        if (readiness.Code == SubmerchantRoutingReadiness.ExternalSubmerchantNotOperationalCode)
        {
            return SubmerchantValidationResult.Invalid(
                $"A subconta da organizacao na processadora nao esta ativa para operar com {ResolveMethodLabel(method)}. Status atual: {merchantAcquirer.ExternalSubmerchantStatus}.",
                PaymentApiErrorCodes.ExternalSubmerchantNotActive);
        }

        return SubmerchantValidationResult.Valid();
    }

    public SubmerchantRoutingReadiness GetRoutingReadiness(MerchantAcquirer merchantAcquirer)
        => submerchantProviderPolicyService.EvaluateRoutingReadiness(merchantAcquirer);

    public bool IsReadyForRouting(MerchantAcquirer merchantAcquirer)
        => GetRoutingReadiness(merchantAcquirer).IsReady;

    private static string ResolveMethodLabel(PaymentMethod method)
        => method switch
        {
            PaymentMethod.Pix => "PIX",
            PaymentMethod.Boleto => "boleto",
            PaymentMethod.CreditCard => "cartao de credito",
            _ => "pagamentos"
        };
}
