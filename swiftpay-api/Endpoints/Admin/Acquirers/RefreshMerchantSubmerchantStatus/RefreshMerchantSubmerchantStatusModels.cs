using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Admin.Acquirers.RefreshMerchantSubmerchantStatus;

public sealed class RefreshMerchantSubmerchantStatusRequest
{
    public Guid AcquirerId { get; set; }
    public Guid MerchantAcquirerId { get; set; }
}

public sealed class RefreshMerchantSubmerchantStatusRequestValidator : Validator<RefreshMerchantSubmerchantStatusRequest>
{
    public RefreshMerchantSubmerchantStatusRequestValidator()
    {
        RuleFor(x => x.AcquirerId)
            .NotEmpty()
            .WithMessage("O identificador da adquirente e obrigatorio.");

        RuleFor(x => x.MerchantAcquirerId)
            .NotEmpty()
            .WithMessage("O identificador do vinculo da organizacao e obrigatorio.");
    }
}

public sealed class RefreshMerchantSubmerchantStatusResponse : BaseResponse<RefreshMerchantSubmerchantStatusData>;

public sealed class RefreshMerchantSubmerchantStatusData
{
    public Guid MerchantAcquirerId { get; set; }
    public string? ExternalSubmerchantId { get; set; }
    public ExternalSubmerchantStatus Status { get; set; }
    public string? LegalName { get; set; }
    public string? DocumentType { get; set; }
    public string? DocumentNumber { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? RejectionReason { get; set; }
}
