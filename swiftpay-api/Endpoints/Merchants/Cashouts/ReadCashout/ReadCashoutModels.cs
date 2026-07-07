using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Merchants.Cashouts.ReadCashout;

public sealed class ReadCashoutRequest
{
    public Guid MerchantId { get; set; }
    public Guid CashoutId { get; set; }
}

public sealed class ReadCashoutRequestValidator : Validator<ReadCashoutRequest>
{
    public ReadCashoutRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.CashoutId)
            .NotEmpty()
            .WithMessage("O identificador do saque é obrigatório.");
    }
}

public sealed class ReadCashoutResponse : BaseResponse<CashoutDetailData>;

public sealed class CashoutDetailData
{
    public Guid Id { get; set; }
    public long Amount { get; set; }
    public long FeeAmount { get; set; }
    public long NetAmount { get; set; }
    public PayoutStatus Status { get; set; }
    public string? PixEndToEndId { get; set; }
    public string? FailureReason { get; set; }
    public CashoutAccountDetail? PayoutAccount { get; set; }
    public string? InlinePixKeyType { get; set; }
    public string? InlinePixKey { get; set; }
    public CashoutEvaluationDetail? Evaluation { get; set; }
    public DateTime RequestedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public sealed class CashoutEvaluationDetail
{
    public DateTime EvaluatedAt { get; set; }
}

public sealed class CashoutAccountDetail
{
    public Guid Id { get; set; }
    public PixKeyType PixKeyType { get; set; }
    public string PixKey { get; set; } = string.Empty;
    public string? HolderName { get; set; }
    public string? BankName { get; set; }
}
