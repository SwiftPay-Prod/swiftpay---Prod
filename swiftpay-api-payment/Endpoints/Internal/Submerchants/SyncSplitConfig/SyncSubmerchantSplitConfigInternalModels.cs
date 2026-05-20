using FastEndpoints;
using FluentValidation;

namespace safefy_api_payment.Endpoints.Internal.Submerchants.SyncSplitConfig;

public sealed class SyncSubmerchantSplitConfigInternalRequest
{
    public Guid AcquirerId { get; set; }
    public Guid MerchantId { get; set; }
    public string ExternalSubmerchantId { get; set; } = string.Empty;
    public string CommissionType { get; set; } = string.Empty;
    public decimal CommissionValue { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class SyncSubmerchantSplitConfigInternalRequestValidator : Validator<SyncSubmerchantSplitConfigInternalRequest>
{
    public SyncSubmerchantSplitConfigInternalRequestValidator()
    {
        RuleFor(x => x.AcquirerId).NotEmpty();
        RuleFor(x => x.MerchantId).NotEmpty();
        RuleFor(x => x.ExternalSubmerchantId).NotEmpty();
        RuleFor(x => x.CommissionType)
            .NotEmpty()
            .Must(type => type.Equals("percentage", StringComparison.OrdinalIgnoreCase)
                || type.Equals("fixed", StringComparison.OrdinalIgnoreCase))
            .WithMessage("commissionType deve ser percentage ou fixed.");
        RuleFor(x => x.CommissionValue)
            .GreaterThanOrEqualTo(0m)
            .WithMessage("commissionValue deve ser maior ou igual a zero.");
    }
}

public sealed class SyncSubmerchantSplitConfigInternalResponse
{
    public bool Success { get; set; }
    public string? ExternalSubmerchantId { get; set; }
    public string? CommissionType { get; set; }
    public decimal? CommissionValue { get; set; }
    public bool? IsActive { get; set; }
    public string? ErrorMessage { get; set; }
}
