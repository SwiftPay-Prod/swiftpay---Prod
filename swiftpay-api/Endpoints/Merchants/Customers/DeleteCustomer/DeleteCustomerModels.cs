using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Merchants.Customers.DeleteCustomer;

public sealed class DeleteCustomerRequest
{
    public Guid MerchantId { get; set; }
    public Guid CustomerId { get; set; }
}

public sealed class DeleteCustomerRequestValidator : Validator<DeleteCustomerRequest>
{
    public DeleteCustomerRequestValidator()
    {
        RuleFor(x => x.MerchantId).NotEmpty().WithMessage("O identificador da organização é obrigatório.");
        RuleFor(x => x.CustomerId).NotEmpty().WithMessage("O identificador do cliente é obrigatório.");
    }
}

public sealed class DeleteCustomerResponse : BaseResponse;
