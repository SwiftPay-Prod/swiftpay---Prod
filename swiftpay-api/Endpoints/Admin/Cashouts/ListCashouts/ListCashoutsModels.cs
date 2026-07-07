using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Admin.Cashouts.ListCashouts;

public sealed class ListCashoutsRequest : IPaginatedRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public PayoutStatus? Status { get; set; }
    public Guid? MerchantId { get; set; }
    public Guid? AcquirerId { get; set; }
    public string? Search { get; set; }
}

public sealed class ListCashoutsRequestValidator : Validator<ListCashoutsRequest>
{
    public ListCashoutsRequestValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThan(0)
            .WithMessage("O número da página deve ser maior que zero.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100)
            .WithMessage("O tamanho da página deve ser entre 1 e 100.");

        RuleFor(x => x.Search)
            .MaximumLength(100)
            .When(x => !string.IsNullOrWhiteSpace(x.Search))
            .WithMessage("A busca deve ter no máximo 100 caracteres.");
    }
}

public sealed class ListCashoutsResponse : BaseResponse<Paginated<AdminMinimalCashout>>;

public sealed class AdminMinimalCashout
{
    public Guid Id { get; set; }
    public long Amount { get; set; }
    public long FeeAmount { get; set; }
    public long AcquirerFeeAmount { get; set; }
    public long SafefyProfitAmount { get; set; }
    public long NetAmount { get; set; }
    public PayoutStatus Status { get; set; }
    public DateTime RequestedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? FailureReason { get; set; }
    public AdminMinimalCashoutMerchantInfo Merchant { get; set; } = null!;
    public AdminMinimalCashoutAccountInfo? PayoutAccount { get; set; }
    public string? InlinePixKeyType { get; set; }
    public string? InlinePixKey { get; set; }
    public AdminMinimalCashoutAcquirerInfo? Acquirer { get; set; }
}

public sealed class AdminMinimalCashoutMerchantInfo
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Document { get; set; }
}

public sealed class AdminMinimalCashoutAccountInfo
{
    public Guid Id { get; set; }
    public PixKeyType PixKeyType { get; set; }
    public string PixKey { get; set; } = string.Empty;
    public string? HolderName { get; set; }
}

public sealed class AdminMinimalCashoutAcquirerInfo
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string Code { get; set; } = string.Empty;
    public string? Nominal { get; set; }
    public string? LogoUrl { get; set; }
}
