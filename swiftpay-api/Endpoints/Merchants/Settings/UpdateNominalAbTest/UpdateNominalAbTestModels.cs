using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;
using System.Text.Json.Serialization;

namespace swiftpay_api.Endpoints.Merchants.Settings.UpdateNominalAbTest;

public sealed class UpdateNominalAbTestRequest
{
    public Guid MerchantId { get; set; }
    public bool Enabled { get; set; }
    public Guid? VariantAMerchantAcquirerId { get; set; }
    public Guid? VariantBMerchantAcquirerId { get; set; }
    public Guid? VariantAAcquirerId { get; set; }
    public Guid? VariantBAcquirerId { get; set; }
    public decimal? VariantAWeightPercent { get; set; }
    public Guid? WinnerMerchantAcquirerId { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public MerchantNominalAbTestLimitType? LimitType { get; set; }
    public int? MaxDurationDays { get; set; }
    public long? MaxTransactions { get; set; }
}

public sealed class UpdateNominalAbTestRequestValidator : Validator<UpdateNominalAbTestRequest>
{
    public UpdateNominalAbTestRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty().WithMessage("O identificador da organizacao e obrigatorio.");

        When(x => x.Enabled, () =>
        {
            RuleFor(x => x)
                .Must(x => x.VariantAMerchantAcquirerId.HasValue || x.VariantAAcquirerId.HasValue)
                .WithMessage("Informe a nominal A do teste.");

            RuleFor(x => x)
                .Must(x => x.VariantBMerchantAcquirerId.HasValue || x.VariantBAcquirerId.HasValue)
                .WithMessage("Informe a nominal B do teste.");

            RuleFor(x => x)
                .Must(x => ResolveVariantId(x.VariantAMerchantAcquirerId, x.VariantAAcquirerId)
                    != ResolveVariantId(x.VariantBMerchantAcquirerId, x.VariantBAcquirerId))
                .WithMessage("As nominais A e B devem ser diferentes.");

            RuleFor(x => x.VariantAWeightPercent)
                .NotNull().WithMessage("Informe o split da nominal A.")
                .InclusiveBetween(0.01m, 99.99m).WithMessage("O split da nominal A deve estar entre 0,01 e 99,99.")
                .Must(value => value.HasValue && decimal.Round(value.Value, 2) == value.Value)
                .WithMessage("O split da nominal A deve ter no maximo 2 casas decimais.");

            RuleFor(x => x.LimitType)
                .NotNull().WithMessage("Informe o tipo de limite do teste A/B.");

            RuleFor(x => x.MaxDurationDays)
                .NotNull().WithMessage("Informe a duracao maxima em dias.")
                .InclusiveBetween(1, 7).WithMessage("A duracao do teste A/B deve ser entre 1 e 7 dias.")
                .When(x => x.LimitType == MerchantNominalAbTestLimitType.Days);

            RuleFor(x => x.MaxTransactions)
                .NotNull().WithMessage("Informe o limite maximo de transacoes.")
                .GreaterThan(0).WithMessage("O limite maximo de transacoes deve ser maior que zero.")
                .When(x => x.LimitType == MerchantNominalAbTestLimitType.Transactions);
        });
    }

    private static Guid? ResolveVariantId(Guid? merchantAcquirerId, Guid? acquirerId)
    {
        return merchantAcquirerId ?? acquirerId;
    }
}

public sealed class UpdateNominalAbTestResponse : BaseResponse<NominalAbTestData>;

public sealed class NominalAbTestData
{
    public bool IsActive { get; set; }
    public Guid? VariantAMerchantAcquirerId { get; set; }
    public Guid? VariantBMerchantAcquirerId { get; set; }
    public decimal VariantAWeightPercent { get; set; }
    public decimal VariantBWeightPercent { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
    public Guid? WinnerMerchantAcquirerId { get; set; }
    public bool IsAutoFinished { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public MerchantNominalAbTestLimitType? LimitType { get; set; }
    public int? MaxDurationDays { get; set; }
    public long? MaxTransactions { get; set; }
    public string Message { get; set; } = string.Empty;
}
