using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Enum;

namespace safefy_api.Endpoints.Merchants.Customers.ReadCustomer;

public sealed class ReadCustomerRequest
{
    public Guid MerchantId { get; set; }
    public Guid CustomerId { get; set; }
}

public sealed class ReadCustomerRequestValidator : Validator<ReadCustomerRequest>
{
    public ReadCustomerRequestValidator()
    {
        RuleFor(x => x.MerchantId).NotEmpty().WithMessage("O identificador da organização é obrigatório.");
        RuleFor(x => x.CustomerId).NotEmpty().WithMessage("O identificador do cliente é obrigatório.");
    }
}

public sealed class ReadCustomerResponse : BaseResponse<CustomerData>;
