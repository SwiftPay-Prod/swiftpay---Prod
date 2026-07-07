using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Files.GetFile;

public sealed class GetFileRequest
{
    public Guid Id { get; set; }
}

public sealed class GetFileValidator : Validator<GetFileRequest>
{
    public GetFileValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty()
            .WithMessage("O identificador do arquivo é obrigatório.");
    }
}

public sealed class GetFileResponse : BaseResponse<FileData>;
