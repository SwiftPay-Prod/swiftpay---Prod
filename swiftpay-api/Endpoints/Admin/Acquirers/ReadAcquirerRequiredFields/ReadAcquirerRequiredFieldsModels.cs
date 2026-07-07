using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Acquirer;

namespace swiftpay_api.Endpoints.Admin.Acquirers.ReadAcquirerRequiredFields;

public sealed class ReadAcquirerRequiredFieldsRequest
{
    public Guid AcquirerId { get; set; }
}

public sealed class ReadAcquirerRequiredFieldsRequestValidator : Validator<ReadAcquirerRequiredFieldsRequest>
{
    public ReadAcquirerRequiredFieldsRequestValidator()
    {
        RuleFor(x => x.AcquirerId)
            .NotEmpty()
            .WithMessage("O identificador da adquirente é obrigatório.");
    }
}

public sealed class ReadAcquirerRequiredFieldsResponse : BaseResponse<AcquirerRequiredFieldsConfig>;
