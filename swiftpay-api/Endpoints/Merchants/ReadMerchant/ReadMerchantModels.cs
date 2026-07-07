using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Merchants.Shared.Models;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Merchants.ReadMerchant;

public sealed class ReadMerchantRequest
{
    public Guid Id { get; set; }
}

public sealed class ReadMerchantValidator : Validator<ReadMerchantRequest>
{
    public ReadMerchantValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");
    }
}

public sealed class ReadMerchantResponse : BaseResponse<MerchantData>;
