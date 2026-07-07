using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Merchants.Shared.Models;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Merchants.CreateMerchant;

public sealed class CreateMerchantRequest
{
    public string? Name { get; set; }
}

public sealed class CreateMerchantValidator : Validator<CreateMerchantRequest>
{
    public CreateMerchantValidator()
    {
        RuleFor(x => x.Name)
            .MaximumLength(200)
            .WithMessage("O nome deve ter no máximo 200 caracteres.");
    }
}

public sealed class CreateMerchantResponse : BaseResponse<MerchantData>;
