using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Admin.Acquirers.SetMerchantAcquirer;

public sealed class SetAcquirerRequest
{
    public Guid MerchantId { get; set; }
    public Guid AcquirerId { get; set; }
    
    // Dynamic Credentials System
    public Dictionary<string, string>? Credentials { get; set; }
    
    public bool SetAsDefault { get; set; } = true;
    public string? Reason { get; set; }
}

public sealed class SetAcquirerRequestValidator : Validator<SetAcquirerRequest>
{
    public SetAcquirerRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty().WithMessage("O identificador da organização é obrigatório");

        RuleFor(x => x.AcquirerId)
            .NotEmpty().WithMessage("O identificador da adquirente é obrigatório");

        RuleFor(x => x.Reason)
            .MaximumLength(500).WithMessage("O motivo deve ter no máximo 500 caracteres");
    }
}

public sealed class SetAcquirerResponse : BaseResponse<SetAcquirerData>;

public sealed record SetAcquirerData(Guid MerchantAcquirerId, string Message);
