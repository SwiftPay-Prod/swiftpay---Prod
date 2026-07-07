using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Merchants.BalanceHistory.ReadBalanceHistory;

public sealed class ReadBalanceHistoryRequest
{
    public Guid MerchantId { get; set; }
    public Guid ReconciliationId { get; set; }
}

public sealed class ReadBalanceHistoryRequestValidator : Validator<ReadBalanceHistoryRequest>
{
    public ReadBalanceHistoryRequestValidator()
    {
        RuleFor(x => x.MerchantId).NotEmpty();
        RuleFor(x => x.ReconciliationId).NotEmpty();
    }
}

public sealed class ReadBalanceHistoryResponse : BaseResponse<BalanceHistoryDetails>;

public sealed class BalanceHistoryDetails
{
    public Guid Id { get; set; }
    public BankReconciliationStatus Status { get; set; }
    public ApiEnvironment Environment { get; set; }

    public BalanceSummary Balance { get; set; } = null!;
    public TransactionSummary Transactions { get; set; } = null!;
    public List<BalanceCorrection> Corrections { get; set; } = [];

    public DateTime ProcessedAt { get; set; }
    public DateTime? CorrectionsAppliedAt { get; set; }
}

public sealed class BalanceSummary
{
    public long PreviousBalance { get; set; }
    public long NewBalance { get; set; }
    public long BalanceChange { get; set; }
    public bool IsPositiveChange { get; set; }
}

public sealed class TransactionSummary
{
    public int TotalPayments { get; set; }
    public long TotalPaymentsAmount { get; set; }

    public int TotalPayouts { get; set; }
    public long TotalPayoutsAmount { get; set; }

    public int TotalRefunds { get; set; }
    public long TotalRefundsAmount { get; set; }

    public long TotalFees { get; set; }

    public int TotalTransactionsAnalyzed { get; set; }
}

public sealed class BalanceCorrection
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string TypeLabel { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public string SeverityLabel { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? SuggestedAction { get; set; }

    public long ExpectedAmount { get; set; }
    public long ActualAmount { get; set; }
    public long Difference { get; set; }

    public bool WasCorrected { get; set; }
    public DateTime? CorrectedAt { get; set; }
    public string? CorrectionDescription { get; set; }
}
