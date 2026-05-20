using FastEndpoints;
using FluentValidation;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_payment.Endpoints.Models;

namespace safefy_api_payment.Endpoints.Checkout.UpdateOrder;

/// <summary>
/// Request para atualizar pedido reservado no checkout.
/// </summary>
public sealed class UpdateOrderRequest
{
    /// <summary>
    /// ShortId do checkout (na URL).
    /// </summary>
    public string ShortId { get; set; } = string.Empty;

    /// <summary>
    /// ID do pedido (na URL).
    /// </summary>
    public Guid OrderId { get; set; }

    /// <summary>
    /// Dados do cliente (opcional).
    /// </summary>
    public UpdateOrderCustomerRequest? Customer { get; set; }

    /// <summary>
    /// Endereço de entrega (opcional).
    /// </summary>
    public UpdateOrderAddressRequest? Address { get; set; }

    /// <summary>
    /// Método de pagamento selecionado (opcional).
    /// </summary>
    public PaymentMethod? SelectedPaymentMethod { get; set; }
}

/// <summary>
/// Dados do cliente para atualização.
/// </summary>
public sealed class UpdateOrderCustomerRequest
{
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Document { get; set; }
}

/// <summary>
/// Endereço de entrega para atualização.
/// </summary>
public sealed class UpdateOrderAddressRequest
{
    public string? ZipCode { get; set; }
    public string? Street { get; set; }
    public string? Number { get; set; }
    public string? Complement { get; set; }
    public string? Neighborhood { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
}

/// <summary>
/// Validador do request.
/// </summary>
public sealed class UpdateOrderRequestValidator : Validator<UpdateOrderRequest>
{
    public UpdateOrderRequestValidator()
    {
        RuleFor(x => x.ShortId)
            .NotEmpty().WithMessage("O identificador do checkout é obrigatório.");

        RuleFor(x => x.OrderId)
            .NotEmpty().WithMessage("O identificador do pedido é obrigatório.");

        RuleFor(x => x.Customer!.Email)
            .EmailAddress().WithMessage("O email deve ser válido.")
            .When(x => x.Customer != null && !string.IsNullOrEmpty(x.Customer.Email));

        RuleFor(x => x.Customer!.Document)
            .MaximumLength(20).WithMessage("O documento deve ter no máximo 20 caracteres.")
            .When(x => x.Customer != null && !string.IsNullOrEmpty(x.Customer.Document));

        RuleFor(x => x.SelectedPaymentMethod)
            .IsInEnum().WithMessage("Método de pagamento inválido.")
            .When(x => x.SelectedPaymentMethod.HasValue);
    }
}

/// <summary>
/// Response da atualização do pedido.
/// </summary>
public sealed class UpdateOrderResponse : BaseResponse<UpdateOrderData>;

/// <summary>
/// Dados retornados após atualização.
/// </summary>
public sealed class UpdateOrderData
{
    public Guid OrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public PaymentMethod? SelectedPaymentMethod { get; set; }
    public UpdateOrderCustomerData? Customer { get; set; }
    public UpdateOrderAddressData? Address { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public sealed class UpdateOrderCustomerData
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Document { get; set; }
}

public sealed class UpdateOrderAddressData
{
    public string? ZipCode { get; set; }
    public string? Street { get; set; }
    public string? Number { get; set; }
    public string? Complement { get; set; }
    public string? Neighborhood { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
}
