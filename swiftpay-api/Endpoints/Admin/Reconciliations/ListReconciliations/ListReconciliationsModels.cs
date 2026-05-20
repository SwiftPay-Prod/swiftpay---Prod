using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api.Validators;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api.Endpoints.Admin.Reconciliations.ListReconciliations;

public sealed class ListReconciliationsRequest : IPaginatedRequest
{
    public Guid? MerchantId { get; set; }
    public BankReconciliationStatus? Status { get; set; }
    public bool OnlyWithProblems { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public sealed class ListReconciliationsRequestValidator : Validator<ListReconciliationsRequest>
{
    public ListReconciliationsRequestValidator()
    {
        RuleFor(x => x.Page).ValidPage();
        RuleFor(x => x.PageSize).ValidPageSize();
    }
}

public sealed class ListReconciliationsResponse : BaseResponse<Paginated<AdminMinimalReconciliation>>;

public sealed class AdminMinimalReconciliation
{
    public Guid Id { get; set; }
    public Guid MerchantId { get; set; }
    public string MerchantName { get; set; } = string.Empty;
    public string Environment { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    
    public long LedgerBalance { get; set; }
    public long CalculatedBalance { get; set; }
    public long BalanceDifference { get; set; }
    
    public int TotalDiscrepancies { get; set; }
    public int CorrectedDiscrepancies { get; set; }
    public bool HasDiscrepancies { get; set; }
    public bool CorrectionsApplied { get; set; }
    
    public string? RequestedByUserName { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public DateTime? ProcessingCompletedAt { get; set; }
}
