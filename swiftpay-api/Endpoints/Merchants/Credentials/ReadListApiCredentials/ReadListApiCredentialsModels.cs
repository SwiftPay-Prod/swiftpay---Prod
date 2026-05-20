using System.Text.Json.Serialization;
using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api.Validators;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api.Endpoints.Merchants.Credentials.ReadListApiCredentials;

public sealed class ReadListApiCredentialsRequest : IPaginatedRequest
{
    public Guid MerchantId { get; set; }
    public string? Name { get; set; }
    public MerchantApiCredentialStatus? Status { get; set; }
    public string? SortBy { get; set; } = "createdAt";
    public string? SortOrder { get; set; } = "desc";
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public sealed class ReadListApiCredentialsRequestValidator : Validator<ReadListApiCredentialsRequest>
{
    public ReadListApiCredentialsRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty().WithMessage("O identificador da organização é obrigatório");

        RuleFor(x => x.SortBy)
            .Must(x => x == null || new[] { "createdAt", "name" }.Contains(x))
            .WithMessage("O campo de ordenação deve ser 'createdAt' ou 'name'");

        RuleFor(x => x.SortOrder)
            .Must(x => x == null || new[] { "asc", "desc" }.Contains(x?.ToLowerInvariant()))
            .WithMessage("A ordem deve ser 'asc' ou 'desc'");

        RuleFor(x => x.Page).ValidPage();
        RuleFor(x => x.PageSize).ValidPageSize();
    }
}

public sealed class ReadListApiCredentialsResponse : BaseResponse<Paginated<ApiCredentialListData>>;

public sealed class ApiCredentialListData
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string ClientId { get; set; } = null!;

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public ApiEnvironment Environment { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public MerchantApiCredentialStatus Status { get; set; }

    public string? AllowedIpRange { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
