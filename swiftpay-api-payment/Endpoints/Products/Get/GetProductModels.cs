using FastEndpoints;
using FluentValidation;
using swiftpay_api_payment.Endpoints.Models;
using swiftpay_api_payment.Endpoints.Products.List;

namespace swiftpay_api_payment.Endpoints.Products.Get;

public class GetProductRequest
{
    public Guid ProductId { get; set; }
}

public sealed class GetProductRequestValidator : Validator<GetProductRequest>
{
    public GetProductRequestValidator()
    {
        RuleFor(x => x.ProductId)
            .NotEmpty()
            .WithMessage("O identificador do produto é obrigatório.");
    }
}

public class GetProductResponse : BaseResponse<ProductData> { }
