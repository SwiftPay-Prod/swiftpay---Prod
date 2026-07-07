using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Admin.Users.CreateReferralCommissionPayment;

public sealed class CreateReferralCommissionPaymentRequest
{
    public Guid UserId { get; set; }
    public long Amount { get; set; }
    public string? Notes { get; set; }
}

public sealed class CreateReferralCommissionPaymentRequestValidator : Validator<CreateReferralCommissionPaymentRequest>
{
    public CreateReferralCommissionPaymentRequestValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("O identificador do usuário é obrigatório.");

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("O valor do pagamento deve ser maior que zero.");

        RuleFor(x => x.Notes)
            .MaximumLength(500).WithMessage("As observações devem ter no máximo 500 caracteres.");
    }
}

public sealed class CreateReferralCommissionPaymentResponse : BaseResponse<AdminReferralCommissionPaymentData>;

public sealed class AdminReferralCommissionPaymentData
{
    public Guid Id { get; set; }
    public Guid ReferrerUserId { get; set; }
    public long Amount { get; set; }
    public long AvailableCommissionBalance { get; set; }
    public DateTime PaidAt { get; set; }
    public string? Notes { get; set; }
    public PixKeyType? PixKeyType { get; set; }
    public string? PixKey { get; set; }
}
