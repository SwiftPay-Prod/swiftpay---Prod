using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Admin.Balance.CreatePlatformBalanceAdjustment;
using swiftpay_api.Endpoints.Models;
using swiftpay_api.Validators;

namespace swiftpay_api.Endpoints.Admin.Balance.ReadPlatformBalanceAdjustments;

public sealed class ReadPlatformBalanceAdjustmentsRequest : IPaginatedRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public AdjustmentScope? Scope { get; set; }
    public Guid? AcquirerId { get; set; }
    public Guid? MerchantId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool ExcludeMerchant { get; set; } = false;
}

public sealed class ReadPlatformBalanceAdjustmentsRequestValidator : Validator<ReadPlatformBalanceAdjustmentsRequest>
{
    public ReadPlatformBalanceAdjustmentsRequestValidator()
    {
        RuleFor(x => x.Page).ValidPage();
        RuleFor(x => x.PageSize).ValidPageSize();
    }
}

public sealed class ReadPlatformBalanceAdjustmentsResponse : BaseResponse<Paginated<AdminPlatformBalanceAdjustmentHistoryData>>;

public sealed class AdminPlatformBalanceAdjustmentHistoryData
{
    public string TransactionId { get; set; } = null!;
    public AdjustmentScope Scope { get; set; }
    public Guid? AcquirerId { get; set; }
    public string? AcquirerName { get; set; }
    public string? AcquirerCode { get; set; }
    public Guid? MerchantId { get; set; }
    public string? MerchantName { get; set; }
    public string? Environment { get; set; }
    public long Amount { get; set; }
    public bool IsCredit { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}
