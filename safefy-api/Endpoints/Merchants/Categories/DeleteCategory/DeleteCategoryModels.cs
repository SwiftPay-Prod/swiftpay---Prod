using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Merchants.Categories.DeleteCategory;

public sealed class DeleteCategoryRequest
{
    public Guid MerchantId { get; set; }
    public Guid CategoryId { get; set; }
}

public sealed class DeleteCategoryRequestValidator : Validator<DeleteCategoryRequest>
{
    public DeleteCategoryRequestValidator()
    {
        RuleFor(x => x.MerchantId).NotEmpty().WithMessage("O identificador da organização é obrigatório.");
        RuleFor(x => x.CategoryId).NotEmpty().WithMessage("O identificador da categoria é obrigatório.");
    }
}

public sealed class DeleteCategoryResponse : BaseResponse;
