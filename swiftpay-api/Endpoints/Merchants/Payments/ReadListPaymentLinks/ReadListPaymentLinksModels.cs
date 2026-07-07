using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api.Validators;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Merchants.Payments.ReadListPaymentLinks;

public sealed class ReadListPaymentLinksRequest : IPaginatedRequest
{
    public Guid MerchantId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public PaymentStatus? Status { get; set; }
    public PaymentMethod? Method { get; set; }
    public string? Search { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public sealed class ReadListPaymentLinksValidator : Validator<ReadListPaymentLinksRequest>
{
    public ReadListPaymentLinksValidator()
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

public sealed class ReadListPaymentLinksResponse : BaseResponse<Paginated<MinimalPaymentLink>>;

public sealed class MinimalPaymentLink
{
    public Guid Id { get; set; }
    public Guid? PaymentId { get; set; }
    public string PaymentLinkUrl { get; set; } = string.Empty;
    public long Amount { get; set; }
    public PaymentMethod Method { get; set; }
    public List<PaymentMethod> EnabledMethods { get; set; } = [];
    public PaymentStatus Status { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool IsExpired { get; set; }
    public string LifetimeStatus { get; set; } = "Active";
    public MinimalPaymentLinkCustomer? Customer { get; set; }
}

public sealed class MinimalPaymentLinkCustomer
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
}
