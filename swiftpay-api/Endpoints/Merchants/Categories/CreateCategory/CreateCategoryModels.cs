using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api.Endpoints.Merchants.Products;
using safefy_api_core.Models.Enum;

namespace safefy_api.Endpoints.Merchants.Categories.CreateCategory;

public sealed class CreateCategoryRequest
{
    public Guid MerchantId { get; set; }
    public string? ExternalId { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
}

public sealed class CreateCategoryRequestValidator : Validator<CreateCategoryRequest>
{
    public CreateCategoryRequestValidator()
    {
        RuleFor(x => x.MerchantId).NotEmpty().WithMessage("O identificador da organização é obrigatório.");
        RuleFor(x => x.Name).NotEmpty().WithMessage("O nome da categoria é obrigatório.")
            .MaximumLength(200).WithMessage("O nome deve ter no máximo 200 caracteres.");
        RuleFor(x => x.ExternalId).MaximumLength(100).WithMessage("O ID externo deve ter no máximo 100 caracteres.");
        RuleFor(x => x.Description).MaximumLength(1000).WithMessage("A descrição deve ter no máximo 1000 caracteres.");
    }
}

public sealed class CreateCategoryResponse : BaseResponse<CategoryData>;
