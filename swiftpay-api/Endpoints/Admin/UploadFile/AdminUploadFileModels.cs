using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Admin.UploadFile;

public sealed class AdminUploadFileRequest
{
    public IFormFile File { get; set; } = null!;
    public UploadFolder Folder { get; set; }
    public bool IsPublic { get; set; } = true;
}

public sealed class AdminUploadFileValidator : Validator<AdminUploadFileRequest>
{
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".pdf", ".webp"];
    private const long MaxFileSize = 10 * 1024 * 1024; // 10MB

    public AdminUploadFileValidator()
    {
        RuleFor(x => x.File)
            .NotNull()
            .WithMessage("O arquivo é obrigatório.");

        RuleFor(x => x.File)
            .Must(file => file == null || file.Length <= MaxFileSize)
            .WithMessage("O arquivo deve ter no máximo 10MB.");

        RuleFor(x => x.File)
            .Must(file =>
            {
                if (file == null) return true;
                var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                return AllowedExtensions.Contains(extension);
            })
            .WithMessage($"Tipo de arquivo não permitido. Extensões permitidas: {string.Join(", ", AllowedExtensions)}");
    }
}

public sealed class AdminUploadFileResponse : BaseResponse<FileData>;
