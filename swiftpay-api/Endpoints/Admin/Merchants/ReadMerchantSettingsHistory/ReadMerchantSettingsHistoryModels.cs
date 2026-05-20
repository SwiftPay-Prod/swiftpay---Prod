using System.Text.Json.Serialization;
using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Admin.Merchants.ReadMerchantSettingsHistory;

public sealed class ReadMerchantSettingsHistoryRequest : IPaginatedRequest
{
    public Guid MerchantId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public MerchantSettingsChangeCategory? Category { get; set; }
}

public sealed class ReadMerchantSettingsHistoryRequestValidator : Validator<ReadMerchantSettingsHistoryRequest>
{
    public ReadMerchantSettingsHistoryRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty().WithMessage("O identificador da organização é obrigatório");

        RuleFor(x => x.Page).GreaterThan(0).WithMessage("A página deve ser maior que 0");
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100).WithMessage("O tamanho da página deve estar entre 1 e 100");
    }
}

public sealed class ReadMerchantSettingsHistoryResponse : BaseResponse<Paginated<SettingsHistoryItem>>;

public sealed class SettingsHistoryItem
{
    public Guid Id { get; set; }
    
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public MerchantSettingsChangeCategory Category { get; set; }
    
    public string? PreviousValuesJson { get; set; }
    public string? NewValuesJson { get; set; }
    public string? ChangedFields { get; set; }
    public string? Description { get; set; }
    public string? Reason { get; set; }
    public bool IsLegacyRecord { get; set; }
    public Guid? ChangedByUserId { get; set; }
    public string? ChangedByUserName { get; set; }
    public DateTime CreatedAt { get; set; }
}
