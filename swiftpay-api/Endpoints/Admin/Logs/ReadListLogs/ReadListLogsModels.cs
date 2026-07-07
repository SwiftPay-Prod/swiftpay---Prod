using System.Text.Json.Serialization;
using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api.Validators;

namespace swiftpay_api.Endpoints.Admin.Logs.ReadListLogs;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum AdminLogType
{
    Api,
    Security,
    Email,
    AcquirerWebhook
}

public sealed class ReadListLogsRequest : IPaginatedRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public AdminLogType Type { get; set; } = AdminLogType.Api;
    public Guid? MerchantId { get; set; }
    public string? AcquirerType { get; set; }
    public string? AcquirerCode { get; set; }
    public int? StatusCode { get; set; }
    public string? Search { get; set; }
    public string? Action { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public sealed class ReadListLogsRequestValidator : Validator<ReadListLogsRequest>
{
    public ReadListLogsRequestValidator()
    {
        RuleFor(x => x.Page).ValidPage();
        RuleFor(x => x.PageSize).ValidPageSize();

        RuleFor(x => x.Search)
            .MaximumLength(200).WithMessage("Search deve ter no maximo 200 caracteres");

        RuleFor(x => x)
            .Must(x => !x.StartDate.HasValue || !x.EndDate.HasValue || x.EndDate.Value >= x.StartDate.Value)
            .WithMessage("O periodo informado e invalido");
    }
}

public sealed class ReadListLogsResponse : BaseResponse<Paginated<AdminLogEntryData>>;

public sealed class AdminLogEntryData
{
    public Guid Id { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public AdminLogType LogType { get; set; }

    public string? Action { get; set; }
    public string? Status { get; set; }
    public int? StatusCode { get; set; }

    public Guid? MerchantId { get; set; }
    public string? MerchantName { get; set; }
    public string? MerchantDocument { get; set; }

    public Guid? CredentialId { get; set; }

    public Guid? UserId { get; set; }
    public string? UserEmail { get; set; }

    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? Location { get; set; }
    public string? ServiceName { get; set; }

    public Guid? AcquirerId { get; set; }
    public string? AcquirerType { get; set; }
    public string? AcquirerCode { get; set; }
    public string? AcquirerDisplayName { get; set; }
    public string? AcquirerLogoUrl { get; set; }

    public string? HttpMethod { get; set; }
    public string? Endpoint { get; set; }
    public string? QueryString { get; set; }
    public string? RequestHeaders { get; set; }
    public string? CorrelationId { get; set; }
    public string? ContentType { get; set; }
    public long? ContentLength { get; set; }

    public string? ErrorCode { get; set; }
    public string? Details { get; set; }
    public string? RequestBody { get; set; }
    public string? ResponseBody { get; set; }

    public Guid? ResourceId { get; set; }
    public string? ResourceType { get; set; }
    public long? ResponseTimeMs { get; set; }

    public string? EmailTo { get; set; }
    public string? EmailSubject { get; set; }
    public string? EmailTemplate { get; set; }
    public string? EmailStatus { get; set; }
    public string? EmailParameters { get; set; }
    public string? EmailErrorMessage { get; set; }
    public long? EmailSendTimeMs { get; set; }

    public DateTime CreatedAt { get; set; }
}
