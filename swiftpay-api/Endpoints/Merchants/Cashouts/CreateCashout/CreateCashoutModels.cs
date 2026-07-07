using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Merchants.Cashouts.CreateCashout;

public sealed class CreateCashoutRequest
{
    public Guid MerchantId { get; set; }
    public long Amount { get; set; }
    public Guid? PayoutAccountId { get; set; }
    public Guid? MerchantAcquirerId { get; set; }
    public bool ConsolidateAllAcquirers { get; set; }
}

public sealed class CreateCashoutRequestValidator : Validator<CreateCashoutRequest>
{
    public CreateCashoutRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.Amount)
            .GreaterThan(0)
            .WithMessage("O valor do saque deve ser maior que zero.");
    }
}

public sealed class CreateCashoutResponse : BaseResponse<CreateCashoutData>;

public sealed class CreateCashoutData
{
    public Guid Id { get; set; }
    public long Amount { get; set; }
    public long PlatformFee { get; set; }
    public long NetAmount { get; set; }
    public string PixKey { get; set; } = string.Empty;
    public string PixKeyType { get; set; } = string.Empty;
    public PayoutStatus Status { get; set; }
    public bool RequiresApproval { get; set; }
    public List<CreateCashoutPayoutItem>? Payouts { get; set; }
}

public sealed class CreateCashoutPayoutItem
{
    public Guid Id { get; set; }
    public long Amount { get; set; }
    public long PlatformFee { get; set; }
    public long NetAmount { get; set; }
    public PayoutStatus Status { get; set; }
}
