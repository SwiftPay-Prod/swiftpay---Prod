using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api.Validators;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Admin.Balance.ReadAcquirerMerchantAvailability;

public sealed class ReadAcquirerMerchantAvailabilityRequest : IPaginatedRequest
{
    public Guid AcquirerId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? Search { get; set; }
}

public sealed class ReadAcquirerMerchantAvailabilityRequestValidator : Validator<ReadAcquirerMerchantAvailabilityRequest>
{
    public ReadAcquirerMerchantAvailabilityRequestValidator()
    {
        RuleFor(x => x.AcquirerId)
            .NotEmpty()
            .WithMessage("O ID da adquirente e obrigatorio.");

        RuleFor(x => x.Page).ValidPage();
        RuleFor(x => x.PageSize).ValidPageSize();
    }
}

public sealed class ReadAcquirerMerchantAvailabilityResponse : BaseResponse<Paginated<AdminPlatformBalanceMerchantAvailabilityData>>;

public sealed class AdminPlatformBalanceMerchantAvailabilityData
{
    public Guid MerchantId { get; set; }
    public string? MerchantName { get; set; }
    public string? Email { get; set; }
    public string? DocumentNumber { get; set; }
    public MerchantKycDocumentType? DocumentType { get; set; }
    public long AvailableBalance { get; set; }
    public long BlockedBalance { get; set; }
    public long ReservedBalance { get; set; }
}

public sealed class AdminPlatformBalanceMerchantAvailabilityProjection
{
    public Guid MerchantId { get; set; }
    public string? MerchantName { get; set; }
    public string? Email { get; set; }
    public string? DocumentNumber { get; set; }
    public MerchantKycDocumentType? DocumentType { get; set; }
    public long AvailableBalance { get; set; }
    public long BlockedBalance { get; set; }
    public long ReservedBalance { get; set; }
}