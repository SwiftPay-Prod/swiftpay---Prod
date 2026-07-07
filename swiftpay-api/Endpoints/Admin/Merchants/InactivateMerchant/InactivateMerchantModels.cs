using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Admin.Merchants.InactivateMerchant;

public sealed class InactivateMerchantRequest
{
    public Guid MerchantId { get; set; }
    public string Reason { get; set; } = null!;
}

public sealed class InactivateMerchantRequestValidator : Validator<InactivateMerchantRequest>
{
    public InactivateMerchantRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty().WithMessage("O identificador da organização é obrigatório.");
    }
}

public sealed class InactivateMerchantResponse : BaseResponse<string>;
