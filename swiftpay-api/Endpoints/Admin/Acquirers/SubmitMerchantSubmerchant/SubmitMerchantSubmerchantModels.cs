using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Admin.Acquirers.SubmitMerchantSubmerchant;

public sealed class SubmitMerchantSubmerchantRequest
{
    public Guid AcquirerId { get; set; }
    public Guid MerchantId { get; set; }
    public bool ForceResubmit { get; set; } = true;
}

public sealed class SubmitMerchantSubmerchantRequestValidator : Validator<SubmitMerchantSubmerchantRequest>
{
    public SubmitMerchantSubmerchantRequestValidator()
    {
        RuleFor(x => x.AcquirerId)
            .NotEmpty()
            .WithMessage("O identificador da adquirente e obrigatorio.");

        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organizacao e obrigatorio.");
    }
}

public sealed class SubmitMerchantSubmerchantResponse : BaseResponse<SubmitMerchantSubmerchantData>;

public sealed class SubmitMerchantSubmerchantData
{
    public Guid MerchantAcquirerId { get; set; }
    public string ExternalSubmerchantId { get; set; } = string.Empty;
    public ExternalSubmerchantStatus Status { get; set; }
    public string? RejectionReason { get; set; }
}
