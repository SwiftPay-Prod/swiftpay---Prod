using System.Text.Json.Serialization;
using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api.Validators;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Merchants.AutomaticCashouts.ReadListLogs;

public sealed class ReadListLogsRequest : IPaginatedRequest
{
    public Guid MerchantId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public AutomaticCashoutStatus? Status { get; set; }
}

public sealed class ReadListLogsRequestValidator : Validator<ReadListLogsRequest>
{
    public ReadListLogsRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty().WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.Page).ValidPage();
        RuleFor(x => x.PageSize).ValidPageSize();
    }
}

public sealed class ReadListLogsResponse : BaseResponse<Paginated<MerchantAutomaticCashoutLogData>>;

public sealed class MerchantAutomaticCashoutLogData
{
    public Guid Id { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public ApiEnvironment Environment { get; set; }

    public long AmountAttempted { get; set; }
    public long NetAmount { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public AutomaticCashoutStatus Status { get; set; }

    public string Message { get; set; } = string.Empty;
    public Guid? PayoutId { get; set; }
    public DateTime CreatedAt { get; set; }
}
