using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Admin.Revenue.ReadPlatformRevenue;

public sealed class ReadPlatformRevenueRequest
{
    [QueryParam]
    public int? MaxAcquirers { get; set; }
}

public sealed class ReadPlatformRevenueRequestValidator : Validator<ReadPlatformRevenueRequest>
{
    public ReadPlatformRevenueRequestValidator()
    {
        RuleFor(x => x.MaxAcquirers)
            .InclusiveBetween(1, 100)
            .When(x => x.MaxAcquirers.HasValue)
            .WithMessage("MaxAcquirers deve ser entre 1 e 100.");
    }
}

public sealed class ReadPlatformRevenueResponse : BaseResponse<AdminPlatformRevenueData>;

public sealed class AdminPlatformRevenueData
{
    public long TotalAvailableForWithdrawal { get; set; }
    public long TotalVolume { get; set; }
    public long TotalFees { get; set; }
    public long TotalTransactions { get; set; }
    public long TotalPayoutVolume { get; set; }
    public long TotalPayoutFees { get; set; }
    public int TotalPayoutTransactions { get; set; }
    public long TotalRevenue { get; set; }
    public int TotalAcquirers { get; set; }
    public List<AdminAcquirerRevenueData> AcquirerRevenues { get; set; } = [];
}

public sealed class AdminAcquirerRevenueData
{
    public Guid AcquirerId { get; set; }
    public string AcquirerName { get; set; } = string.Empty;
    public string AcquirerCode { get; set; } = string.Empty;
    public string? AcquirerLogoUrl { get; set; }
    public List<string> OperationTypes { get; set; } = [];
    public long Volume { get; set; }
    public long Fees { get; set; }
    public long Transactions { get; set; }
    public long PayoutVolume { get; set; }
    public long PayoutFees { get; set; }
    public int PayoutTransactions { get; set; }
    
    /// <summary>
    /// Valor líquido que entrou na conta da adquirente (Volume - AcquirerFee)
    /// </summary>
    public long Settlement { get; set; }
}
