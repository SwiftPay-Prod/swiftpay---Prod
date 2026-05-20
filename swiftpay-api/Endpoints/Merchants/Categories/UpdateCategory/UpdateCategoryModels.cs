using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api.Endpoints.Merchants.Products;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Merchants.Categories.UpdateCategory;

public sealed class UpdateCategoryRequest
{
    public Guid MerchantId { get; set; }
    public Guid CategoryId { get; set; }
    public string? ExternalId { get; set; }
    public string? Name { get; set; }
    public string? Description { get; set; }
    public CategoryStatus? Status { get; set; }
}

public sealed class UpdateCategoryRequestValidator : Validator<UpdateCategoryRequest>
{
    public UpdateCategoryRequestValidator()
    {
        RuleFor(x => x.MerchantId).NotEmpty().WithMessage("O identificador da organização é obrigatório.");
        RuleFor(x => x.CategoryId).NotEmpty().WithMessage("O identificador da categoria é obrigatório.");
        RuleFor(x => x.Name).MaximumLength(200).When(x => x.Name != null).WithMessage("O nome deve ter no máximo 200 caracteres.");
        RuleFor(x => x.ExternalId).MaximumLength(100).WithMessage("O ID externo deve ter no máximo 100 caracteres.");
        RuleFor(x => x.Description).MaximumLength(1000).WithMessage("A descrição deve ter no máximo 1000 caracteres.");
        RuleFor(x => x.Status).IsInEnum().When(x => x.Status.HasValue).WithMessage("O status é inválido.");
    }
}

public sealed class UpdateCategoryResponse : BaseResponse<CategoryData>;
