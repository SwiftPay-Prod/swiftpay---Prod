using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api.Validators;

namespace swiftpay_api.Endpoints.Merchants.Payments.ReadListPayments;

public sealed class ReadListPaymentsRequest : IPaginatedRequest
{
    public Guid MerchantId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public PaymentStatus? Status { get; set; }
    public PaymentMethod? Method { get; set; }
    public string? Search { get; set; }
    public Guid? CustomerId { get; set; }
    
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public sealed class ReadListPaymentsValidator : Validator<ReadListPaymentsRequest>
{
    public ReadListPaymentsValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        this.AddPaginationRules();

        RuleFor(x => x.EndDate)
            .GreaterThanOrEqualTo(x => x.StartDate)
            .When(x => x.StartDate.HasValue && x.EndDate.HasValue)
            .WithMessage("A data final deve ser maior ou igual à data inicial.");

        RuleFor(x => x.Search)
            .MaximumLength(100)
            .When(x => !string.IsNullOrWhiteSpace(x.Search))
            .WithMessage("A busca deve ter no máximo 100 caracteres.");
    }
}

public sealed class ReadListPaymentsResponse : BaseResponse<Paginated<MinimalPayment>>;

public sealed class MinimalPayment
{
    public Guid Id { get; set; }
    public string? TransactionVisualizationUrl { get; set; }
    public long Amount { get; set; }
    public long Fee { get; set; }
    public long NetAmount { get; set; }
    public string? Description { get; set; }
    public PaymentMethod Method { get; set; }
    public PaymentStatus Status { get; set; }
    public PaymentRequestSource RequestSource { get; set; } = PaymentRequestSource.Api;
    public bool IsCheckoutPayment { get; set; }
    public string? CheckoutName { get; set; }
    public bool HasCallbackUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? RefundedAt { get; set; }
    public MinimalPaymentCustomer? Customer { get; set; }
    public MinimalPaymentPix? Pix { get; set; }
}

public sealed class MinimalPaymentCustomer
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Document { get; set; }
    public bool HasFallbackContactData { get; set; }
}

public sealed class MinimalPaymentPix
{
    public string? TxId { get; set; }
    public string? EndToEndId { get; set; }
    public string? PayerName { get; set; }
    public string? PayerDocument { get; set; }
    public string? PayerBank { get; set; }
    public DateTime? PaidAt { get; set; }
}
