using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Admin.PlatformPayouts.PreviewPlatformPayout;

public sealed class PreviewPlatformPayoutRequest
{
    public long? TotalAmount { get; set; }
    public List<PreviewPlatformPayoutAcquirerItem>? AcquirerItems { get; set; }
    public bool IncludeAllAcquirers { get; set; }
}

public sealed class PreviewPlatformPayoutAcquirerItem
{
    public Guid AcquirerId { get; set; }
    public long Amount { get; set; }
}

public sealed class PreviewPlatformPayoutRequestValidator : Validator<PreviewPlatformPayoutRequest>
{
    public PreviewPlatformPayoutRequestValidator()
    {
        RuleFor(x => x)
            .Must(x => x.TotalAmount.HasValue || (x.AcquirerItems != null && x.AcquirerItems.Count > 0))
            .When(x => !x.IncludeAllAcquirers)
            .WithMessage("Informe o valor total ou os valores por adquirente.");

        When(x => x.TotalAmount.HasValue, () =>
        {
            RuleFor(x => x.TotalAmount!.Value)
                .GreaterThan(0).WithMessage("O valor total deve ser maior que zero.");
        });

        When(x => x.AcquirerItems != null && x.AcquirerItems.Count > 0, () =>
        {
            RuleForEach(x => x.AcquirerItems!).ChildRules(item =>
            {
                item.RuleFor(i => i.AcquirerId)
                    .NotEmpty().WithMessage("O identificador da adquirente é obrigatório.");

                item.RuleFor(i => i.Amount)
                    .GreaterThan(0).WithMessage("O valor deve ser maior que zero.");
            });
        });
    }
}

public sealed class PreviewPlatformPayoutResponse : BaseResponse<AdminPreviewPlatformPayoutData>;

public sealed class AdminPreviewPlatformPayoutData
{
    public long TotalAvailableAmount { get; set; }
    public long? RequestedTotalAmount { get; set; }
    public long TotalAmount { get; set; }
    public long TotalFee { get; set; }
    public long TotalNetAmount { get; set; }
    public long UndistributedAmount { get; set; }
    public string? DistributionReason { get; set; }
    public List<AdminPreviewPlatformPayoutItemData> Items { get; set; } = [];
}

public sealed class AdminPreviewPlatformPayoutItemData
{
    public Guid AcquirerId { get; set; }
    public string AcquirerName { get; set; } = null!;
    public string AcquirerCode { get; set; } = null!;
    public string? AcquirerLogoUrl { get; set; }
    public long AvailableBalance { get; set; }
    public long Amount { get; set; }
    public long AcquirerFee { get; set; }
    public long NetAmount { get; set; }
    public string PayoutFeeMode { get; set; } = null!;
    public long PayoutFeeFixed { get; set; }
    public int PayoutFeePercentage { get; set; }
}
