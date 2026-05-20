using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Enum;

namespace safefy_api.Endpoints.Merchants.UploadFile;

public sealed class UploadFileRequest
{
    public IFormFile File { get; set; } = null!;
    public UploadFolder Folder { get; set; }
    public Guid MerchantId { get; set; }
    public bool IsPublic { get; set; } = false;
}

public sealed class UploadFileValidator : Validator<UploadFileRequest>
{
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".pdf", ".webp"];
    private const long MaxFileSize = 10 * 1024 * 1024; // 10MB

    public UploadFileValidator()
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

        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador do merchant é obrigatório.");
    }
}

public sealed class UploadFileResponse : BaseResponse<FileData>;
