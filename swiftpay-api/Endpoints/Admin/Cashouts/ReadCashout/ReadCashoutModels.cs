using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Admin.Cashouts.ReadCashout;

public sealed class ReadCashoutRequest
{
    public Guid CashoutId { get; set; }
}

public sealed class ReadCashoutRequestValidator : Validator<ReadCashoutRequest>
{
    public ReadCashoutRequestValidator()
    {
        RuleFor(x => x.CashoutId)
            .NotEmpty()
            .WithMessage("O identificador do saque é obrigatório.");
    }
}

public sealed class ReadCashoutResponse : BaseResponse<AdminCashoutDetails>;

public sealed class AdminCashoutDetails
{
    public Guid Id { get; set; }
    public long Amount { get; set; }
    public long FeeAmount { get; set; }
    public long AcquirerFeeAmount { get; set; }
    public long SwiftPayProfitAmount { get; set; }
    public long NetAmount { get; set; }
    public PayoutStatus Status { get; set; }
    public DateTime RequestedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? FailureReason { get; set; }
    public string? AcquirerTransactionId { get; set; }
    public AdminCashoutMerchantDetails Merchant { get; set; } = null!;
    public AdminCashoutAccountDetails? PayoutAccount { get; set; }
    public string? InlinePixKeyType { get; set; }
    public string? InlinePixKey { get; set; }
    public AdminCashoutAcquirerDetails? Acquirer { get; set; }
    public AdminCashoutEvaluationDetails? Evaluation { get; set; }
    public List<AdminCashoutLedgerEntry> LedgerEntries { get; set; } = [];
}

public sealed class AdminCashoutEvaluationDetails
{
    public DateTime EvaluatedAt { get; set; }
    public AdminCashoutEvaluatorDetails EvaluatedBy { get; set; } = null!;
}

public sealed class AdminCashoutEvaluatorDetails
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string Email { get; set; } = string.Empty;
}

public sealed class AdminCashoutMerchantDetails
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public MerchantStatus Status { get; set; }
    public AdminCashoutUserDetails User { get; set; } = null!;
}

public sealed class AdminCashoutUserDetails
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string Email { get; set; } = string.Empty;
}

public sealed class AdminCashoutAccountDetails
{
    public Guid Id { get; set; }
    public PixKeyType PixKeyType { get; set; }
    public string PixKey { get; set; } = string.Empty;
    public string? HolderName { get; set; }
    public string? HolderDocument { get; set; }
    public PayoutAccountStatus Status { get; set; }
}

public sealed class AdminCashoutAcquirerDetails
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Nominal { get; set; }
}

public sealed class AdminCashoutLedgerEntry
{
    public Guid Id { get; set; }
    public string TransactionType { get; set; } = string.Empty;
    public long Amount { get; set; }
    public long BalanceAfter { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
}
