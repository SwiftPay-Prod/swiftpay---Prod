using System.Text.Json.Serialization;
using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Merchants.Settings.UpdateSettings;

public sealed class UpdateSettingsRequest
{
    public Guid MerchantId { get; set; }
    public bool? IsAutomaticCashoutEnabled { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public AutomaticCashoutFrequency? AutomaticCashoutFrequency { get; set; }
    public long? AutomaticCashoutMinAmount { get; set; }
    public long? AutomaticCashoutMaxAmount { get; set; }
    public Guid? AutomaticCashoutPayoutAccountId { get; set; }
}

public sealed class UpdateSettingsRequestValidator : Validator<UpdateSettingsRequest>
{
    public UpdateSettingsRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty().WithMessage("O identificador da organização é obrigatório");

        RuleFor(x => x.AutomaticCashoutMinAmount)
            .GreaterThanOrEqualTo(0)
            .When(x => x.AutomaticCashoutMinAmount.HasValue)
            .WithMessage("O valor mínimo para saque automatizado não pode ser negativo.");

        RuleFor(x => x.AutomaticCashoutMaxAmount)
            .GreaterThanOrEqualTo(0)
            .When(x => x.AutomaticCashoutMaxAmount.HasValue)
            .WithMessage("O valor máximo para saque automatizado não pode ser negativo.");

        RuleFor(x => x.AutomaticCashoutMaxAmount)
            .GreaterThan(x => x.AutomaticCashoutMinAmount)
            .When(x => x.AutomaticCashoutMaxAmount.HasValue && x.AutomaticCashoutMinAmount.HasValue)
            .WithMessage("O valor máximo para saque automatizado deve ser maior que o valor mínimo.");

        RuleFor(x => x.AutomaticCashoutPayoutAccountId)
            .NotEmpty()
            .When(x => x.AutomaticCashoutPayoutAccountId.HasValue)
            .WithMessage("A conta de saque automatizado é inválida.");
    }
}

public sealed class UpdateSettingsResponse : BaseResponse<MerchantSettingsData>;

public sealed class MerchantSettingsData
{
    public Guid Id { get; set; }
    public Guid MerchantId { get; set; }
    public bool SelfNominalSwitchEnabled { get; set; }
    public bool IsAutomaticCashoutEnabled { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public AutomaticCashoutFrequency AutomaticCashoutFrequency { get; set; }
    public long? AutomaticCashoutMinAmount { get; set; }
    public long? AutomaticCashoutMaxAmount { get; set; }
    public Guid? AutomaticCashoutPayoutAccountId { get; set; }
    public DateTime UpdatedAt { get; set; }
}
