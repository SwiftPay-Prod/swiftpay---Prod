using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Users.Profile.UploadAvatar;

public sealed class UploadAvatarRequest
{
    public IFormFile File { get; set; } = null!;
}

public sealed class UploadAvatarRequestValidator : Validator<UploadAvatarRequest>
{
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    private const long MaxFileSize = 5 * 1024 * 1024; // 5MB

    public UploadAvatarRequestValidator()
    {
        RuleFor(x => x.File)
            .NotNull().WithMessage("O arquivo é obrigatório.");

        RuleFor(x => x.File)
            .Must(file => file == null || file.Length <= MaxFileSize)
            .WithMessage("A imagem deve ter no máximo 5MB.");

        RuleFor(x => x.File)
            .Must(file =>
            {
                if (file == null) return true;
                var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                return AllowedExtensions.Contains(extension);
            })
            .WithMessage($"Tipo de arquivo não permitido. Use: {string.Join(", ", AllowedExtensions)}");
    }
}

public sealed class UploadAvatarResponse : BaseResponse<UploadAvatarData>;

public sealed class UploadAvatarData
{
    public Guid FileId { get; set; }
    public string Url { get; set; } = null!;
}
