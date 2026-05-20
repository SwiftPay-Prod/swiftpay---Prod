using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Admin.PlatformPayouts.CreatePlatformPayout;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Admin.PlatformPayouts.CreateSimulatedPlatformPayout;

public sealed class CreateSimulatedPlatformPayoutRequest
{
    public Guid? PlatformPayoutAccountId { get; set; }
    public long? TotalAmount { get; set; }
    public List<CreateSimulatedPlatformPayoutAcquirerItem>? AcquirerItems { get; set; }
    public string? Notes { get; set; }
}

public sealed class CreateSimulatedPlatformPayoutAcquirerItem
{
    public Guid AcquirerId { get; set; }
    public long Amount { get; set; }
}

public sealed class CreateSimulatedPlatformPayoutRequestValidator : Validator<CreateSimulatedPlatformPayoutRequest>
{
    public CreateSimulatedPlatformPayoutRequestValidator()
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

public sealed class CreateSimulatedPlatformPayoutResponse : BaseResponse<AdminPlatformPayoutData>;
