using FastEndpoints;
using FluentValidation;
using System.Text.Json.Serialization;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Users.Referrals.CreateReferralCommissionWithdrawalRequest;

public sealed class CreateReferralCommissionWithdrawalRequestRequest
{
    public long Amount { get; set; }
    public string? Notes { get; set; }
}

public sealed class CreateReferralCommissionWithdrawalRequestValidator : Validator<CreateReferralCommissionWithdrawalRequestRequest>
{
    public CreateReferralCommissionWithdrawalRequestValidator()
    {
        RuleFor(x => x.Amount)
            .GreaterThan(0)
            .WithMessage("O valor do saque deve ser maior que zero.");

        RuleFor(x => x.Notes)
            .MaximumLength(500).When(x => !string.IsNullOrWhiteSpace(x.Notes))
            .WithMessage("As observações devem ter no máximo 500 caracteres.");
    }
}

public sealed class CreateReferralCommissionWithdrawalRequestResponse : BaseResponse<ReferralCommissionWithdrawalRequestData>;

public sealed class ReferralCommissionWithdrawalRequestData
{
    public Guid Id { get; set; }
    public long Amount { get; set; }
    public long FeeAmount { get; set; }
    public long NetAmount { get; set; }
    public DateTime RequestedAt { get; set; }
    public DateTime NextAllowedRequestAt { get; set; }
    public int WithdrawalIntervalValue { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public ReferralWithdrawalIntervalUnit WithdrawalIntervalUnit { get; set; }
    public long MinWithdrawalAmount { get; set; }
    public string? Notes { get; set; }
    public ReferralCommissionWithdrawalRequestStatus Status { get; set; }
}
