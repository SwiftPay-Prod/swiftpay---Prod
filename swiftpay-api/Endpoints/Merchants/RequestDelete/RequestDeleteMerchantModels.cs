using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Merchants.RequestDelete;

public sealed class RequestDeleteMerchantRequest
{
    public Guid MerchantId { get; set; }
}

public sealed class RequestDeleteMerchantRequestValidator : Validator<RequestDeleteMerchantRequest>
{
    public RequestDeleteMerchantRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");
    }
}

public sealed class RequestDeleteMerchantResponse : BaseResponse;
