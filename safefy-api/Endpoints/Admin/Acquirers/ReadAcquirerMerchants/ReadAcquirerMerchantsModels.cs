using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api.Validators;

namespace safefy_api.Endpoints.Admin.Acquirers.ReadAcquirerMerchants;

public sealed class ReadAcquirerMerchantsRequest : IPaginatedRequest
{
    public Guid AcquirerId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Search { get; set; }
    public string? ExternalSubmerchantStatus { get; set; }
    public bool? HasExternalSubmerchant { get; set; }
}

public sealed class ReadAcquirerMerchantsRequestValidator : Validator<ReadAcquirerMerchantsRequest>
{
    public ReadAcquirerMerchantsRequestValidator()
    {
        RuleFor(x => x.AcquirerId).NotEmpty().WithMessage("O ID da adquirente é obrigatório.");
        RuleFor(x => x.Page).ValidPage();
        RuleFor(x => x.PageSize).ValidPageSize();
    }
}

public sealed class ReadAcquirerMerchantsResponse : BaseResponse<Paginated<AcquirerMerchantData>>;

public sealed class AcquirerMerchantData
{
    public Guid MerchantAcquirerId { get; set; }
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string? LegalName { get; set; }
    public string? DocumentNumber { get; set; }
    public string? DocumentType { get; set; }
    public string Status { get; set; } = null!;
    public bool IsActive { get; set; }
    public bool IsDefault { get; set; }
    public bool UsesSubaccount { get; set; }
    public string? ExternalSubmerchantId { get; set; }
    public string? ExternalSubmerchantStatus { get; set; }
    public DateTime? ExternalOnboardingSubmittedAt { get; set; }
    public DateTime? ExternalOnboardingCompletedAt { get; set; }
    public string? ExternalOnboardingRejectionReason { get; set; }
    public DateTime CreatedAt { get; set; }
}
