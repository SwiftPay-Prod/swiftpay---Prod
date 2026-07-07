using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Files.DeleteFile;

public sealed class DeleteFileRequest
{
    public Guid Id { get; set; }
}

public sealed class DeleteFileValidator : Validator<DeleteFileRequest>
{
    public DeleteFileValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty()
            .WithMessage("O identificador do arquivo é obrigatório.");
    }
}

public sealed class DeleteFileResponse : BaseResponse;
