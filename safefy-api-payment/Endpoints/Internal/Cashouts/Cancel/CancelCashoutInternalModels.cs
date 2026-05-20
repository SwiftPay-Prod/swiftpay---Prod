using FastEndpoints;
using FluentValidation;

namespace safefy_api_payment.Endpoints.Internal.Cashouts.Cancel;

public sealed class CancelCashoutInternalRequest
{
    public Guid CashoutId { get; set; }
    public Guid MerchantId { get; set; }
    public Guid UserId { get; set; }
}

public sealed class CancelCashoutInternalRequestValidator : Validator<CancelCashoutInternalRequest>
{
    public CancelCashoutInternalRequestValidator()
    {
        RuleFor(x => x.CashoutId).NotEmpty();
        RuleFor(x => x.MerchantId).NotEmpty();
        RuleFor(x => x.UserId).NotEmpty();
    }
}

public sealed class CancelCashoutInternalResponse
{
    public bool Success { get; set; }
    public Guid? CashoutId { get; set; }
    public string? Status { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
}
