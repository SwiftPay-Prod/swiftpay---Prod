using FastEndpoints;
using FluentValidation;
using System.Text.Json.Serialization;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Admin.Users.UpdateUserReferralSettings;

public sealed class UpdateUserReferralSettingsRequest
{
    public Guid UserId { get; set; }
    public int? ReferralDurationMonths { get; set; }
    public int? ReferralCommissionPercentage { get; set; }
    public int? ReferralCommissionWithdrawalIntervalValue { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public global::safefy_api_core.Models.Database.ReferralWithdrawalIntervalUnit? ReferralCommissionWithdrawalIntervalUnit { get; set; }
    public long? ReferralCommissionMinWithdrawalAmount { get; set; }
    public long? ReferralCommissionWithdrawalFeeFixed { get; set; }
}

public sealed class UpdateUserReferralSettingsRequestValidator : Validator<UpdateUserReferralSettingsRequest>
{
    public UpdateUserReferralSettingsRequestValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("O identificador do usuário é obrigatório.");

        RuleFor(x => x.ReferralDurationMonths)
            .InclusiveBetween(1, 120).When(x => x.ReferralDurationMonths.HasValue)
            .WithMessage("ReferralDurationMonths deve estar entre 1 e 120 meses");

        RuleFor(x => x.ReferralCommissionPercentage)
            .InclusiveBetween(0, 10000).When(x => x.ReferralCommissionPercentage.HasValue)
            .WithMessage("ReferralCommissionPercentage deve estar entre 0 e 10000 (0% a 100%)");

        RuleFor(x => x.ReferralCommissionWithdrawalIntervalValue)
            .InclusiveBetween(0, 120).When(x => x.ReferralCommissionWithdrawalIntervalValue.HasValue)
            .WithMessage("ReferralCommissionWithdrawalIntervalValue deve estar entre 0 e 120");

        RuleFor(x => x.ReferralCommissionMinWithdrawalAmount)
            .GreaterThanOrEqualTo(0).When(x => x.ReferralCommissionMinWithdrawalAmount.HasValue)
            .WithMessage("ReferralCommissionMinWithdrawalAmount deve ser maior ou igual a 0");

        RuleFor(x => x.ReferralCommissionWithdrawalFeeFixed)
            .GreaterThanOrEqualTo(0).When(x => x.ReferralCommissionWithdrawalFeeFixed.HasValue)
            .WithMessage("ReferralCommissionWithdrawalFeeFixed deve ser maior ou igual a 0");
    }
}

public sealed class UpdateUserReferralSettingsResponse : BaseResponse<UpdateUserReferralSettingsData>;

public sealed class UpdateUserReferralSettingsData
{
    public Guid UserId { get; set; }
    public int? ReferralDurationMonths { get; set; }
    public int? ReferralCommissionPercentage { get; set; }
    public int? ReferralCommissionWithdrawalIntervalValue { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public global::safefy_api_core.Models.Database.ReferralWithdrawalIntervalUnit? ReferralCommissionWithdrawalIntervalUnit { get; set; }
    public long? ReferralCommissionMinWithdrawalAmount { get; set; }
    public long? ReferralCommissionWithdrawalFeeFixed { get; set; }
}
