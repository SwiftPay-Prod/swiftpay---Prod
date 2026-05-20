using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Admin.Acquirers.ReadListAcquirers;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Admin.Acquirers.ReadAcquirer;

public sealed class ReadAcquirerRequest
{
    public Guid AcquirerId { get; set; }
}

public sealed class ReadAcquirerRequestValidator : Validator<ReadAcquirerRequest>
{
    public ReadAcquirerRequestValidator()
    {
        RuleFor(x => x.AcquirerId)
            .NotEmpty()
            .WithMessage("O identificador da adquirente é obrigatório.");
    }
}

public sealed class ReadAcquirerResponse : BaseResponse<AdminAcquirerData>;
