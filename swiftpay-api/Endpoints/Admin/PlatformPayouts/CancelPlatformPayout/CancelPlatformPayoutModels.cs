using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Admin.PlatformPayouts.CancelPlatformPayout;

public sealed class CancelPlatformPayoutRequest
{
    public Guid Id { get; set; }
    public string? Reason { get; set; }
}

public sealed class CancelPlatformPayoutRequestValidator : Validator<CancelPlatformPayoutRequest>
{
    public CancelPlatformPayoutRequestValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("O identificador do saque é obrigatório.");

        RuleFor(x => x.Reason)
            .MaximumLength(500).WithMessage("O motivo deve ter no máximo 500 caracteres.")
            .When(x => !string.IsNullOrWhiteSpace(x.Reason));
    }
}

public sealed class CancelPlatformPayoutResponse : BaseResponse;
