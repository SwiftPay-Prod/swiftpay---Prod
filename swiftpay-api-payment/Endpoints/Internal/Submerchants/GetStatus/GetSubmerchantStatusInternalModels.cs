using FastEndpoints;
using FluentValidation;

namespace safefy_api_payment.Endpoints.Internal.Submerchants.GetStatus;

public sealed class GetSubmerchantStatusInternalRequest
{
    public Guid AcquirerId { get; set; }
    public string ExternalSubmerchantId { get; set; } = string.Empty;
}

public sealed class GetSubmerchantStatusInternalRequestValidator : Validator<GetSubmerchantStatusInternalRequest>
{
    public GetSubmerchantStatusInternalRequestValidator()
    {
        RuleFor(x => x.AcquirerId).NotEmpty();
        RuleFor(x => x.ExternalSubmerchantId).NotEmpty();
    }
}

public sealed class GetSubmerchantStatusInternalResponse
{
    public bool Success { get; set; }
    public string? ExternalSubmerchantId { get; set; }
    public string? Status { get; set; }
    public string? LegalName { get; set; }
    public string? DocumentType { get; set; }
    public string? DocumentNumber { get; set; }
    public string? CreatedAt { get; set; }
    public string? UpdatedAt { get; set; }
    public string? RejectionReason { get; set; }
    public string? ErrorMessage { get; set; }
}
