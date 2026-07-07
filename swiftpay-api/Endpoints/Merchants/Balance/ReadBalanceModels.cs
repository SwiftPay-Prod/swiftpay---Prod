using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Merchants.Balance;

public sealed class ReadBalanceRequest
{
    public Guid MerchantId { get; set; }
}

public sealed class ReadBalanceValidator : Validator<ReadBalanceRequest>
{
    public ReadBalanceValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");
    }
}

public sealed class ReadBalanceResponse : BaseResponse<ReadBalanceData>;

public sealed class ReadBalanceData
{
    public string Currency { get; set; } = "BRL";
    public BalanceInfo Balance { get; set; } = null!;
    public TotalsInfo Totals { get; set; } = null!;
    public PeriodInfo Period { get; set; } = null!;
    public List<LastTransactionInfo> LastTransactions { get; set; } = [];
    public DateTime UpdatedAt { get; set; }
}

public sealed class BalanceInfo
{
    public long Available { get; set; }
    public long WithdrawNowAvailable { get; set; }
    public bool RequiresFullWithdrawalNow { get; set; }
    public long Pending { get; set; }
    public long Reserved { get; set; }
    public long Total { get; set; }
    public List<AcquirerBucketBalanceInfo> AcquirerBucketBalances { get; set; } = [];
}

public sealed class AcquirerBucketBalanceInfo
{
    public Guid? MerchantAcquirerId { get; set; }
    public long Balance { get; set; }
}

public sealed class TotalsInfo
{
    public long LifetimeVolume { get; set; }
    public long LifetimePayouts { get; set; }
    public long LifetimeRefunds { get; set; }
    public long LifetimeFeesPaid { get; set; }
}

public sealed class PeriodInfo
{
    public long VolumeToday { get; set; }
    public long VolumeThisWeek { get; set; }
    public long VolumeThisMonth { get; set; }
}

public sealed class LastTransactionInfo
{
    public string Id { get; set; } = null!;
    public string Type { get; set; } = null!;
    public long Amount { get; set; }
    public string Description { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}
