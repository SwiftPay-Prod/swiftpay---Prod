using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Files.GetFile;

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
