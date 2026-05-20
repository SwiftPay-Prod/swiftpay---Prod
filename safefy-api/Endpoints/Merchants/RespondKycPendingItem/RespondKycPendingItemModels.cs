using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Merchants.RespondKycPendingItem;

public sealed class RespondKycPendingItemRequest
{
    public Guid MerchantId { get; set; }
    public Guid ItemId { get; set; }
    public string? Response { get; set; }
}

public sealed class RespondKycPendingItemValidator : Validator<RespondKycPendingItemRequest>
{
    public RespondKycPendingItemValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.ItemId)
            .NotEmpty()
            .WithMessage("O identificador do item é obrigatório.");

        RuleFor(x => x.Response)
            .NotEmpty()
            .WithMessage("A resposta é obrigatória.")
            .MaximumLength(2000)
            .WithMessage("A resposta deve ter no máximo 2000 caracteres.");
    }
}

public sealed class RespondKycPendingItemResponse : BaseResponse;
