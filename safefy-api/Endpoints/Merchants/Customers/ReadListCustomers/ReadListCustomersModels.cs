using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api.Endpoints.Merchants.Customers.ReadListCustomers;

public sealed class ReadListCustomersRequest : IPaginatedRequest
{
    public Guid MerchantId { get; set; }
    public string? Search { get; set; }
    public CustomerStatus? Status { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public sealed class ReadListCustomersRequestValidator : Validator<ReadListCustomersRequest>
{
    public ReadListCustomersRequestValidator()
    {
        RuleFor(x => x.MerchantId).NotEmpty().WithMessage("O identificador da organização é obrigatório.");
        RuleFor(x => x.Page).GreaterThan(0).WithMessage("A página deve ser maior que 0.");
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100).WithMessage("O tamanho da página deve estar entre 1 e 100.");
    }
}

public sealed class ReadListCustomersResponse : BaseResponse<Paginated<MinimalCustomer>>;
