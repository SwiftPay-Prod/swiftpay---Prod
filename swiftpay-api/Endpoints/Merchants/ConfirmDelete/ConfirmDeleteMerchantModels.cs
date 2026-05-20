using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Merchants.ConfirmDelete;

public sealed class ConfirmDeleteMerchantRequest
{
    public Guid MerchantId { get; set; }
    public string Code { get; set; } = null!;
}

public sealed class ConfirmDeleteMerchantRequestValidator : Validator<ConfirmDeleteMerchantRequest>
{
    public ConfirmDeleteMerchantRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.Code)
            .NotEmpty()
            .WithMessage("O código de confirmação é obrigatório.")
            .Length(6)
            .WithMessage("O código de confirmação deve ter 6 dígitos.")
            .Matches(@"^\d{6}$")
            .WithMessage("O código de confirmação deve conter apenas números.");
    }
}

public sealed class ConfirmDeleteMerchantResponse : BaseResponse;
