using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Admin.Merchants.SuspendMerchant;

public sealed class SuspendMerchantRequest
{
    public Guid MerchantId { get; set; }
    public string Reason { get; set; } = null!;
}

public sealed class SuspendMerchantRequestValidator : Validator<SuspendMerchantRequest>
{
    public SuspendMerchantRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty().WithMessage("O identificador da organização é obrigatório.");
    }
}

public sealed class SuspendMerchantResponse : BaseResponse<string>;
