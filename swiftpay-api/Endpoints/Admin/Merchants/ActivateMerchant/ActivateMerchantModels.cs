using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Admin.Merchants.ActivateMerchant;

public sealed class ActivateMerchantRequest
{
    public Guid MerchantId { get; set; }
    public string? Reason { get; set; }
}

public sealed class ActivateMerchantRequestValidator : Validator<ActivateMerchantRequest>
{
    public ActivateMerchantRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty().WithMessage("O identificador da organização é obrigatório.");
    }
}

public sealed class ActivateMerchantResponse : BaseResponse<string>;
