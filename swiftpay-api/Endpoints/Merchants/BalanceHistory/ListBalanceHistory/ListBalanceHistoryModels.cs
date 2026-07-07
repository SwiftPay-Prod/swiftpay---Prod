using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api.Validators;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Merchants.BalanceHistory.ListBalanceHistory;

public sealed class ListBalanceHistoryRequest : IPaginatedRequest
{
    public Guid MerchantId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public sealed class ListBalanceHistoryRequestValidator : Validator<ListBalanceHistoryRequest>
{
    public ListBalanceHistoryRequestValidator()
    {
        RuleFor(x => x.MerchantId).NotEmpty();
        RuleFor(x => x.Page).ValidPage();
        RuleFor(x => x.PageSize).ValidPageSize();
    }
}

public sealed class ListBalanceHistoryResponse : BaseResponse<Paginated<MinimalBalanceHistory>>;

public sealed class MinimalBalanceHistory
{
    public Guid Id { get; set; }
    public BankReconciliationStatus Status { get; set; }
    public ApiEnvironment Environment { get; set; }
    
    public long PreviousBalance { get; set; }
    public long NewBalance { get; set; }
    public long BalanceChange { get; set; }
    
    public bool HasCorrections { get; set; }
    public int TotalCorrections { get; set; }
    
    public DateTime ProcessedAt { get; set; }
    public DateTime? CorrectionsAppliedAt { get; set; }
}
