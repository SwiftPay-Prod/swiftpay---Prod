using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Admin.PlatformPayouts.ReprocessPendingPlatformPayout;

public sealed class ReprocessPendingPlatformPayoutRequest
{
    public Guid Id { get; set; }
}

public sealed class ReprocessPendingPlatformPayoutRequestValidator : Validator<ReprocessPendingPlatformPayoutRequest>
{
    public ReprocessPendingPlatformPayoutRequestValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty()
            .WithMessage("O identificador do saque da plataforma é obrigatório.");
    }
}

public sealed class ReprocessPendingPlatformPayoutResponse : BaseResponse<AdminReprocessPendingPlatformPayoutData>;

public sealed class AdminReprocessPendingPlatformPayoutData
{
    public Guid PlatformPayoutId { get; set; }
    public ApiEnvironment Environment { get; set; }
    public int TotalPendingItems { get; set; }
    public int RepublishedItems { get; set; }
}
