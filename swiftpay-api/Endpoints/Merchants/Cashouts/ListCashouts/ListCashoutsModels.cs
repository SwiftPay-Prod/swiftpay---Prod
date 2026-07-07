using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api.Validators;

namespace swiftpay_api.Endpoints.Merchants.Cashouts.ListCashouts;

public sealed class ListCashoutsRequest : IPaginatedRequest
{
    public Guid MerchantId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public PayoutStatus? Status { get; set; }
    public Guid? PayoutAccountId { get; set; }
    public string? Search { get; set; }
    
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public sealed class ListCashoutsRequestValidator : Validator<ListCashoutsRequest>
{
    public ListCashoutsRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.Page).ValidPage();
        RuleFor(x => x.PageSize).ValidPageSize();

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

public sealed class ListCashoutsResponse : BaseResponse<Paginated<CashoutListItem>>;

public sealed class CashoutListItem
{
    public Guid Id { get; set; }
    public long Amount { get; set; }
    public long FeeAmount { get; set; }
    public long NetAmount { get; set; }
    public PayoutStatus Status { get; set; }
    public string? PixEndToEndId { get; set; }
    public string? FailureReason { get; set; }
    public CashoutAccountSummary? PayoutAccount { get; set; }
    public string? InlinePixKeyType { get; set; }
    public string? InlinePixKey { get; set; }
    public DateTime RequestedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public sealed class CashoutAccountSummary
{
    public Guid Id { get; set; }
    public PixKeyType PixKeyType { get; set; }
    public string PixKey { get; set; } = string.Empty;
}
