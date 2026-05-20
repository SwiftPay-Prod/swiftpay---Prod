using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Merchants.Settings.SwitchNominal;

public sealed class SwitchNominalRequest
{
    public Guid MerchantId { get; set; }
    public Guid? MerchantAcquirerId { get; set; }
    public Guid? AcquirerId { get; set; }
}

public sealed class SwitchNominalRequestValidator : Validator<SwitchNominalRequest>
{
    public SwitchNominalRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty().WithMessage("O identificador da organizacao e obrigatorio.");

        RuleFor(x => x)
            .Must(x => x.MerchantAcquirerId.HasValue || x.AcquirerId.HasValue)
            .WithMessage("Informe o identificador da nominal.");
    }
}

public sealed class SwitchNominalResponse : BaseResponse<SwitchNominalData>;

public sealed class SwitchNominalData
{
    public Guid MerchantAcquirerId { get; set; }
    public string Nominal { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
