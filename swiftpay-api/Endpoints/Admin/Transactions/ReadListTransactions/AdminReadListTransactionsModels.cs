using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api.Validators;

namespace swiftpay_api.Endpoints.Admin.Transactions.ReadListTransactions;

public sealed class AdminReadListTransactionsRequest : IPaginatedRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public Guid? MerchantId { get; set; }
    public Guid? AcquirerId { get; set; }
    public PaymentStatus? Status { get; set; }
    public PaymentMethod? Method { get; set; }
    public string? Search { get; set; }
}

public sealed class AdminReadListTransactionsValidator : Validator<AdminReadListTransactionsRequest>
{
    public AdminReadListTransactionsValidator()
    {
        this.AddPaginationRules();

        RuleFor(x => x.Search)
            .MaximumLength(100)
            .When(x => !string.IsNullOrEmpty(x.Search))
            .WithMessage("A busca deve ter no máximo 100 caracteres.");
    }
}

public sealed class AdminReadListTransactionsResponse : BaseResponse<Paginated<AdminMinimalTransaction>>;

public sealed class AdminMinimalTransaction
{
    public Guid Id { get; set; }
    public string? TransactionVisualizationUrl { get; set; }
    public bool IsWayneProtocol { get; set; }
    public long Amount { get; set; }
    public long Fee { get; set; }
    public long Profit { get; set; }
    public PaymentMethod Method { get; set; }
    public PaymentRequestSource RequestSource { get; set; }
    public PaymentStatus Status { get; set; }
    public ApiEnvironment Environment { get; set; }
    public DateTime CreatedAt { get; set; }
    public AdminTransactionMerchantInfo Merchant { get; set; } = null!;
    public AdminTransactionAcquirerInfo? Acquirer { get; set; }
    public AdminTransactionPixInfo? Pix { get; set; }
}

public sealed class AdminTransactionMerchantInfo
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string? Document { get; set; }
}

public sealed class AdminTransactionAcquirerInfo
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string? DisplayName { get; set; }
    public string Code { get; set; } = null!;
    public string? Nominal { get; set; }
    public string? LogoUrl { get; set; }
}

public sealed class AdminTransactionPixInfo
{
    public string? PayerName { get; set; }
    public string? PayerBank { get; set; }
}
