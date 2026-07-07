using System.Text.Json.Serialization;
using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Merchants.Settings.ReadNominals;

public sealed class ReadNominalsRequest
{
    public Guid MerchantId { get; set; }
}

public sealed class ReadNominalsRequestValidator : Validator<ReadNominalsRequest>
{
    public ReadNominalsRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty().WithMessage("O identificador da organizacao e obrigatorio.");
    }
}

public sealed class ReadNominalsResponse : BaseResponse<ReadNominalsData>;

public sealed class ReadNominalsData
{
    public Guid CurrentMerchantAcquirerId { get; set; }
    public string CurrentNominal { get; set; } = string.Empty;

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public MerchantKycOperationType? MerchantOperationType { get; set; }

    public bool HasLegacyBalanceWarning { get; set; }
    public string LegacyBalanceWarningMessage { get; set; } = string.Empty;
    public MerchantNominalAbTestInfo? AbTest { get; set; }
    public List<MerchantNominalOption> Nominals { get; set; } = [];
}

public sealed class MerchantNominalAbTestInfo
{
    public bool IsActive { get; set; }
    public Guid VariantAMerchantAcquirerId { get; set; }
    public Guid VariantBMerchantAcquirerId { get; set; }
    public decimal VariantAWeightPercent { get; set; }
    public decimal VariantBWeightPercent { get; set; }
    public DateTime StartedAt { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public MerchantNominalAbTestLimitType LimitType { get; set; }
    public int? MaxDurationDays { get; set; }
    public long? MaxTransactions { get; set; }
    public Guid? WinnerMerchantAcquirerId { get; set; }
    public bool IsAutoFinished { get; set; }
}

public sealed class MerchantNominalOption
{
    public Guid? MerchantAcquirerId { get; set; }
    public Guid AcquirerId { get; set; }
    public string Nominal { get; set; } = string.Empty;
    public DateTime AcquirerCreatedAt { get; set; }
    public decimal? ConversionYesterday { get; set; }
    public decimal? ConversionLast7Days { get; set; }
    public decimal? MerchantConversionYesterday { get; set; }
    public decimal? MerchantConversionLast7Days { get; set; }
    public long TotalTransactions { get; set; }
    public bool IsCurrent { get; set; }
    public bool IsInAbTest { get; set; }
    public bool SupportsPix { get; set; }
    public bool SupportsBoleto { get; set; }
    public bool SupportsCreditCard { get; set; }
}
