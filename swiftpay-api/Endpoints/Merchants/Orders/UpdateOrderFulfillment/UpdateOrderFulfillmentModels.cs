using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Merchants.Orders.UpdateOrderFulfillment;

public sealed class UpdateOrderFulfillmentRequest
{
    public Guid MerchantId { get; set; }
    public Guid OrderId { get; set; }
    public OrderFulfillmentStatus FulfillmentStatus { get; set; }
}

public sealed class UpdateOrderFulfillmentValidator : Validator<UpdateOrderFulfillmentRequest>
{
    public UpdateOrderFulfillmentValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.OrderId)
            .NotEmpty()
            .WithMessage("O identificador do pedido é obrigatório.");

        RuleFor(x => x.FulfillmentStatus)
            .IsInEnum()
            .WithMessage("Status de entrega inválido.");
    }
}

public sealed class UpdateOrderFulfillmentResponse : BaseResponse<UpdateOrderFulfillmentData>;

public sealed class UpdateOrderFulfillmentData
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = null!;
    public OrderStatus Status { get; set; }
    public OrderFulfillmentStatus FulfillmentStatus { get; set; }
    public DateTime UpdatedAt { get; set; }
}
