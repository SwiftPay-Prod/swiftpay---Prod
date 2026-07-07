using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Admin.PlatformPayouts.CreatePlatformPayout;

public sealed class CreatePlatformPayoutRequest
{
    public Guid? PlatformPayoutAccountId { get; set; }
    public long? TotalAmount { get; set; }
    public List<CreatePlatformPayoutAcquirerItem>? AcquirerItems { get; set; }
    public string? Notes { get; set; }
}

public sealed class CreatePlatformPayoutAcquirerItem
{
    public Guid AcquirerId { get; set; }
    public long Amount { get; set; }
}

public sealed class CreatePlatformPayoutRequestValidator : Validator<CreatePlatformPayoutRequest>
{
    public CreatePlatformPayoutRequestValidator()
    {
        RuleFor(x => x.PlatformPayoutAccountId)
            .NotEmpty().WithMessage("O identificador da conta de saque é obrigatório.")
            .When(x => x.PlatformPayoutAccountId.HasValue);

        RuleFor(x => x)
            .Must(x => x.TotalAmount.HasValue || (x.AcquirerItems != null && x.AcquirerItems.Count > 0))
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

        RuleFor(x => x.Notes)
            .MaximumLength(500).WithMessage("As observações devem ter no máximo 500 caracteres.")
            .When(x => !string.IsNullOrEmpty(x.Notes));
    }
}

public sealed class CreatePlatformPayoutResponse : BaseResponse<AdminPlatformPayoutData>;

public sealed class AdminPlatformPayoutData
{
    public Guid Id { get; set; }
    public Guid PlatformPayoutAccountId { get; set; }
    public string Environment { get; set; } = null!;
    public long TotalAmount { get; set; }
    public long TotalFee { get; set; }
    public long TotalNetAmount { get; set; }
    public string Status { get; set; } = null!;
    public string? Notes { get; set; }
    public Guid RequestedByUserId { get; set; }
    public string? RequestedByUserName { get; set; }
    public DateTime RequestedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public AdminPlatformPayoutAccountInfo? PayoutAccount { get; set; }
    public List<AdminPlatformPayoutItemData> Items { get; set; } = [];
    public DateTime CreatedAt { get; set; }
}

public sealed class AdminPlatformPayoutAccountInfo
{
    public Guid Id { get; set; }
    public string PixKeyType { get; set; } = null!;
    public string PixKey { get; set; } = null!;
    public string HolderName { get; set; } = null!;
    public string? BankName { get; set; }
}

public sealed class AdminPlatformPayoutItemData
{
    public Guid Id { get; set; }
    public Guid AcquirerId { get; set; }
    public string AcquirerName { get; set; } = null!;
    public string AcquirerCode { get; set; } = null!;
    public string? AcquirerLogoUrl { get; set; }
    public long Amount { get; set; }
    public long AcquirerFee { get; set; }
    public long NetAmount { get; set; }
    public string Status { get; set; } = null!;
    public string? AcquirerTransactionId { get; set; }
    public string? PixEndToEndId { get; set; }
    public string? FailureReason { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}
