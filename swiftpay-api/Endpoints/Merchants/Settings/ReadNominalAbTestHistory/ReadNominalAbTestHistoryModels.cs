using System.Text.Json.Serialization;
using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Merchants.Settings.ReadNominalAbTestHistory;

public sealed class ReadNominalAbTestHistoryRequest
{
    public Guid MerchantId { get; set; }
}

public sealed class ReadNominalAbTestHistoryRequestValidator : Validator<ReadNominalAbTestHistoryRequest>
{
    public ReadNominalAbTestHistoryRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty().WithMessage("O identificador da organizacao e obrigatorio.");
    }
}

public sealed class ReadNominalAbTestHistoryResponse : BaseResponse<ReadNominalAbTestHistoryData>;

public sealed class ReadNominalAbTestHistoryData
{
    public List<MerchantNominalAbTestHistoryItem> Items { get; set; } = [];
}

public sealed class MerchantNominalAbTestHistoryItem
{
    public Guid Id { get; set; }
    public bool IsActive { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
    public bool IsAutoFinished { get; set; }
    public string? EndReason { get; set; }
    public Guid? WinnerMerchantAcquirerId { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public MerchantNominalAbTestLimitType LimitType { get; set; }
    public int? MaxDurationDays { get; set; }
    public long? MaxTransactions { get; set; }
    public MerchantNominalAbTestVariantStats VariantA { get; set; } = new();
    public MerchantNominalAbTestVariantStats VariantB { get; set; } = new();
    public List<MerchantNominalAbTestChartPoint> Chart { get; set; } = [];
}

public sealed class MerchantNominalAbTestVariantStats
{
    public Guid MerchantAcquirerId { get; set; }
    public Guid AcquirerId { get; set; }
    public string DisplayLabel { get; set; } = string.Empty;
    public long TotalTransactions { get; set; }
    public long ApprovedTransactions { get; set; }
    public decimal ApprovalRate { get; set; }
}

public sealed class MerchantNominalAbTestChartPoint
{
    public DateTime HourUtc { get; set; }
    public string Label { get; set; } = string.Empty;
    public int VariantATotal { get; set; }
    public int VariantAApproved { get; set; }
    public decimal VariantAApprovalRate { get; set; }
    public int VariantBTotal { get; set; }
    public int VariantBApproved { get; set; }
    public decimal VariantBApprovalRate { get; set; }
}
