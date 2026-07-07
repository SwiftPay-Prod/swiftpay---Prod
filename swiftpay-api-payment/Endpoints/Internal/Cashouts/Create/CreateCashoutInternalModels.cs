using FastEndpoints;
using FluentValidation;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_payment.Endpoints.Internal.Cashouts.Create;

public sealed class CreateCashoutInternalRequest
{
    public Guid MerchantId { get; set; }
    public Guid UserId { get; set; }
    public long Amount { get; set; }
    public Guid? PayoutAccountId { get; set; }
    public Guid? MerchantAcquirerId { get; set; }
    public string IpAddress { get; set; } = string.Empty;
    public string? Location { get; set; }
    public ApiEnvironment Environment { get; set; } = ApiEnvironment.Production;
    public bool ConsolidateAllAcquirers { get; set; }
}

public sealed class CreateCashoutInternalRequestValidator : Validator<CreateCashoutInternalRequest>
{
    public CreateCashoutInternalRequestValidator()
    {
        RuleFor(x => x.MerchantId).NotEmpty();
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.IpAddress).NotEmpty();
    }
}

public sealed class CreateCashoutInternalResponse
{
    public bool Success { get; set; }
    public Guid? CashoutId { get; set; }
    public string? Status { get; set; }
    public long? Amount { get; set; }
    public long? PlatformFee { get; set; }
    public long? NetAmount { get; set; }
    public string? PixKey { get; set; }
    public string? PixKeyType { get; set; }
    public bool RequiresApproval { get; set; }
    public List<CreateCashoutInternalPayoutItem>? Payouts { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
}

public sealed class CreateCashoutInternalPayoutItem
{
    public Guid Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public long Amount { get; set; }
    public long PlatformFee { get; set; }
    public long NetAmount { get; set; }
}
