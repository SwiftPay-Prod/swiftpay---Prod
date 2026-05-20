using System.Text.Json.Serialization;
using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Admin.Merchants.ReadMerchantAcquirerHistory;

public sealed class ReadMerchantAcquirerHistoryRequest : IPaginatedRequest
{
    public Guid MerchantId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public sealed class ReadMerchantAcquirerHistoryRequestValidator : Validator<ReadMerchantAcquirerHistoryRequest>
{
    public ReadMerchantAcquirerHistoryRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty().WithMessage("O identificador da organização é obrigatório");

        RuleFor(x => x.Page).GreaterThan(0).WithMessage("A página deve ser maior que 0");
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100).WithMessage("O tamanho da página deve estar entre 1 e 100");
    }
}

public sealed class ReadMerchantAcquirerHistoryResponse : BaseResponse<Paginated<AcquirerHistoryItem>>;

public sealed class AcquirerHistoryItem
{
    public Guid Id { get; set; }
    
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public MerchantAcquirerChangeAction Action { get; set; }
    
    public Guid? PreviousAcquirerId { get; set; }
    public string? PreviousAcquirerName { get; set; }
    public Guid? NewAcquirerId { get; set; }
    public string? NewAcquirerName { get; set; }
    public string? Reason { get; set; }
    public bool IsLegacyRecord { get; set; }
    public Guid? ChangedByUserId { get; set; }
    public string? ChangedByUserName { get; set; }
    public DateTime CreatedAt { get; set; }
}
