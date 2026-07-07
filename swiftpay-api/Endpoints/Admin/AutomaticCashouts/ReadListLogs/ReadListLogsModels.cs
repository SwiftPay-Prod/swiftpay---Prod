using System.Text.Json.Serialization;
using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api.Validators;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Admin.AutomaticCashouts.ReadListLogs;

public sealed class ReadListLogsRequest : IPaginatedRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public Guid? MerchantId { get; set; }
    public bool? PlatformOnly { get; set; }
    public AutomaticCashoutStatus? Status { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public ApiEnvironment? Environment { get; set; }
}

public sealed class ReadListLogsRequestValidator : Validator<ReadListLogsRequest>
{
    public ReadListLogsRequestValidator()
    {
        RuleFor(x => x.Page).ValidPage();
        RuleFor(x => x.PageSize).ValidPageSize();
    }
}

public sealed class ReadListLogsResponse : BaseResponse<Paginated<AdminAutomaticCashoutLogData>>;

public sealed class AdminAutomaticCashoutLogData
{
    public Guid Id { get; set; }
    public Guid? MerchantId { get; set; }
    public string? MerchantName { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public ApiEnvironment Environment { get; set; }

    public long AmountAttempted { get; set; }
    public long NetAmount { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public AutomaticCashoutStatus Status { get; set; }

    public string Message { get; set; } = string.Empty;
    public string? TechnicalDetails { get; set; }
    public Guid? PayoutId { get; set; }
    public DateTime CreatedAt { get; set; }
}
