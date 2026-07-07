using FluentValidation;
using swiftpay_api_payment.Endpoints.Models;

namespace swiftpay_api_payment.Validators;

public static class PaginationValidator
{
    public static IRuleBuilderOptions<T, int> ValidPage<T>(this IRuleBuilder<T, int> ruleBuilder)
    {
        return ruleBuilder
            .GreaterThanOrEqualTo(1)
            .WithMessage("A página deve ser maior ou igual a 1.");
    }

    public static IRuleBuilderOptions<T, int> ValidPageSize<T>(this IRuleBuilder<T, int> ruleBuilder, int maxPageSize = 100)
    {
        return ruleBuilder
            .GreaterThanOrEqualTo(1)
            .WithMessage("O tamanho da página deve ser maior ou igual a 1.")
            .LessThanOrEqualTo(maxPageSize)
            .WithMessage($"O tamanho da página deve ser menor ou igual a {maxPageSize}.");
    }

    public static void AddPaginationRules<T>(this AbstractValidator<T> validator) where T : IPaginatedRequest
    {
        validator.RuleFor(x => x.Page).ValidPage();
        validator.RuleFor(x => x.PageSize).ValidPageSize();
    }
}
