using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Merchants.Checkouts.TransferCheckoutToProduction;

public sealed class TransferCheckoutToProductionRequest
{
    public Guid MerchantId { get; set; }
    public Guid CheckoutId { get; set; }
}

public sealed class TransferCheckoutToProductionRequestValidator : Validator<TransferCheckoutToProductionRequest>
{
    public TransferCheckoutToProductionRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.CheckoutId)
            .NotEmpty()
            .WithMessage("O identificador do checkout é obrigatório.");
    }
}

public sealed class TransferCheckoutToProductionData
{
    public Guid SourceCheckoutId { get; set; }
    public Guid TargetCheckoutId { get; set; }
    public ApiEnvironment TargetEnvironment { get; set; }
    public int SkippedProductsCount { get; set; }
    public int SkippedCouponsCount { get; set; }
}

public sealed class TransferCheckoutToProductionResponse : BaseResponse<TransferCheckoutToProductionData>;
